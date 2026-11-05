package client

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/api"
	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
)

func TestStreamMetricsReadsEvents(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/events" || r.Method != http.MethodGet {
			t.Fatalf("request = %s %s", r.Method, r.URL.Path)
		}
		w.Header().Set("Content-Type", "text/event-stream")
		_, _ = fmt.Fprint(w, ": keepalive\n\ndata: {\"seq\":7,\"time\":1720000000000,\"active\":3,\"throughput\":12.5}\n\n")
	}))
	defer server.Close()

	api, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	var got []protocol.Metrics
	err = api.StreamMetrics(context.Background(), func(metric protocol.Metrics) {
		got = append(got, metric)
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0] != (protocol.Metrics{Seq: 7, Time: 1720000000000, Active: 3, Throughput: 12.5}) {
		t.Fatalf("metrics = %+v", got)
	}
}

func TestSessionReportsUnauthorizedAPIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(protocol.ErrorResponse{Error: "sign in required"})
	}))
	defer server.Close()

	api, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	_, err = api.Session(context.Background())
	if !IsUnauthorized(err) || err.Error() != "sign in required" {
		t.Fatalf("Session error = %v", err)
	}
}

func TestNativeClientsKeepSessionsAndJobsIsolated(t *testing.T) {
	server := httptest.NewServer(api.NewServer())
	defer server.Close()

	alice, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	bob, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()

	aliceUser, err := alice.Login(ctx, "alice", "demo-alice")
	if err != nil || aliceUser.ID != "alice" {
		t.Fatalf("Alice login = %+v, %v", aliceUser, err)
	}
	bobUser, err := bob.Login(ctx, "bob", "demo-bob")
	if err != nil || bobUser.ID != "bob" {
		t.Fatalf("Bob login = %+v, %v", bobUser, err)
	}

	aliceJobs, err := alice.Jobs(ctx)
	if err != nil || len(aliceJobs) != 2 || aliceJobs[0].ID != "alice-1" {
		t.Fatalf("Alice jobs = %+v, %v", aliceJobs, err)
	}
	bobJobs, err := bob.Jobs(ctx)
	if err != nil || len(bobJobs) != 2 || bobJobs[0].ID != "bob-1" {
		t.Fatalf("Bob jobs = %+v, %v", bobJobs, err)
	}

	created, err := alice.CreateJob(ctx, protocol.JobInput{Name: "Alice private job", Priority: 3, Status: "queued"})
	if err != nil {
		t.Fatal(err)
	}
	updated, err := alice.UpdateJob(ctx, created.ID, protocol.JobInput{Name: "Alice edited job", Priority: 4, Status: "paused"})
	if err != nil || updated.Name != "Alice edited job" {
		t.Fatalf("Alice update = %+v, %v", updated, err)
	}
	if _, err := bob.UpdateJob(ctx, created.ID, protocol.JobInput{Name: "Foreign edit", Priority: 1, Status: "running"}); !hasAPIStatus(err, http.StatusNotFound) {
		t.Fatalf("Bob updating Alice's job error = %v, want 404", err)
	}
	bobJobs, err = bob.Jobs(ctx)
	if err != nil || len(bobJobs) != 2 || bobJobs[0].ID != "bob-1" || bobJobs[1].ID != "bob-2" {
		t.Fatalf("Alice's changes appeared in Bob's jobs: %+v, %v", bobJobs, err)
	}

	if err := alice.Logout(ctx); err != nil {
		t.Fatal(err)
	}
	if jobs, err := bob.Jobs(ctx); err != nil || len(jobs) != 2 {
		t.Fatalf("Bob jobs after Alice logout = %+v, %v", jobs, err)
	}

	streamCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	metricReceived := make(chan struct{}, 1)
	streamDone := make(chan error, 1)
	go func() {
		streamDone <- bob.StreamMetrics(streamCtx, func(protocol.Metrics) {
			select {
			case metricReceived <- struct{}{}:
			default:
			}
		})
	}()
	select {
	case <-metricReceived:
	case <-time.After(3 * time.Second):
		t.Fatal("metrics stream did not emit an event")
	}
	cancel()
	select {
	case <-streamDone:
	case <-time.After(3 * time.Second):
		t.Fatal("metrics stream did not close after cancellation")
	}
}

func TestSharedCookieRejectsStaleIdentityUntilSessionReconciles(t *testing.T) {
	server := httptest.NewServer(api.NewServer())
	defer server.Close()

	alice, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	bob, err := New(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	sharedJar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	alice.http.Jar = sharedJar
	bob.http.Jar = sharedJar
	ctx := context.Background()

	if user, err := alice.Login(ctx, "alice", "demo-alice"); err != nil || user.ID != "alice" {
		t.Fatalf("Alice login = %+v, %v", user, err)
	}
	streamCtx, cancelStream := context.WithCancel(ctx)
	defer cancelStream()
	metricReceived := make(chan struct{}, 1)
	streamDone := make(chan error, 1)
	go func() {
		streamDone <- alice.StreamMetrics(streamCtx, func(protocol.Metrics) {
			select {
			case metricReceived <- struct{}{}:
			default:
			}
		})
	}()
	select {
	case <-metricReceived:
	case <-time.After(3 * time.Second):
		t.Fatal("Alice metrics stream did not start")
	}

	if user, err := bob.Login(ctx, "bob", "demo-bob"); err != nil || user.ID != "bob" {
		t.Fatalf("Bob replacement login = %+v, %v", user, err)
	}
	if _, err := alice.Jobs(ctx); !IsUnauthorized(err) {
		t.Fatalf("stale Alice jobs error = %v, want 401", err)
	}
	input := protocol.JobInput{Name: "Stale write", Priority: 2, Status: "queued"}
	if _, err := alice.CreateJob(ctx, input); !IsUnauthorized(err) {
		t.Fatalf("stale Alice create error = %v, want 401", err)
	}
	if _, err := alice.UpdateJob(ctx, "alice-1", input); !IsUnauthorized(err) {
		t.Fatalf("stale Alice update error = %v, want 401", err)
	}
	if err := alice.Logout(ctx); !IsUnauthorized(err) {
		t.Fatalf("stale Alice logout error = %v, want 401", err)
	}

	select {
	case <-streamDone:
	case <-time.After(3 * time.Second):
		t.Fatal("Alice's original stream continued after login replaced its session")
	}

	if jobs, err := bob.Jobs(ctx); err != nil || len(jobs) != 2 {
		t.Fatalf("Bob's session after stale Alice requests = %+v, %v", jobs, err)
	}
	user, err := alice.Session(ctx)
	if err != nil || user.ID != "bob" {
		t.Fatalf("Alice Session reconciliation = %+v, %v", user, err)
	}
	if jobs, err := alice.Jobs(ctx); err != nil || len(jobs) != 2 || jobs[0].ID != "bob-1" {
		t.Fatalf("Alice jobs after Session reconciliation = %+v, %v", jobs, err)
	}
}

func hasAPIStatus(err error, status int) bool {
	var apiErr *HTTPError
	return errors.As(err, &apiErr) && apiErr.Status == status
}
