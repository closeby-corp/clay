// Package protocol contains the JSON contract shared by the API and UI.
package protocol

type User struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type Job struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Priority int    `json:"priority"`
	Status   string `json:"status"`
}

type JobInput struct {
	Name     string `json:"name"`
	Priority int    `json:"priority"`
	Status   string `json:"status"`
}

type Metrics struct {
	Seq        int64   `json:"seq"`
	Time       int64   `json:"time"`
	Active     int     `json:"active"`
	Throughput float64 `json:"throughput"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
