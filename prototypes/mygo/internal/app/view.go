package app

import (
	"fmt"
	"strings"
	"time"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/protocol"
	"github.com/egoist/mygo/ui"
	"github.com/oneo-me/onevra/source/components"
	"github.com/oneo-me/onevra/source/components/chart"
	"github.com/oneo-me/onevra/source/icons/lucide"
	"github.com/oneo-me/onevra/source/theme"
)

func (a *App) View(c *ui.Context) {
	theme.Apply(c)
	t := c.Theme()
	w, _ := c.Size()
	if a.user == nil {
		a.loginView(c)
		return
	}
	ui.Row(c).Fill().MinWidth(0).Background(t.Background).Children(func() {
		if w >= 760 {
			a.sidebar(c)
		}
		ui.Column(c).Fill().MinWidth(0).Children(func() {
			if w < 760 {
				a.compactNav(c)
			}
			a.header(c)
			if a.logoutMessage != "" {
				errorBanner(c, a.logoutMessage)
			}
			ui.Scroll(c).Fill().MinWidth(0).Children(func() {
				ui.Column(c).FillWidth().MinWidth(0).Padding(t.Space(5), t.Space(6), t.Space(8)).Gap(t.Space(5)).Children(func() {
					switch a.page {
					case pageJobs:
						a.jobsPage(c)
					case pageMetrics:
						a.metricsPage(c)
					default:
						a.overviewPage(c)
					}
				})
			})
		})
	})
}

func (a *App) loginView(c *ui.Context) {
	t := c.Theme()
	ui.Column(c).Fill().Padding(t.Space(6)).AlignItems(ui.Center).Justify(ui.Center).Children(func() {
		ui.Column(c).Width(420).MaxWidthPercent(100).MinWidth(0).Padding(t.Space(6)).Gap(t.Space(4)).
			Background(t.Surface).Border(1, t.Border).Radius(t.Space(3)).Children(func() {
			ui.Row(c).AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
				brandMark(c)
				ui.Column(c).Gap(t.Space(.5)).Children(func() {
					components.Text(c, "MyGo Operations").FontSize(t.Rem(1.2)).Bold()
					components.Text(c, "LOCAL DEMO WORKSPACE").FontSize(t.Rem(.75)).Bold().TextColor(t.TextMuted)
				})
			})
			if a.loadingUser {
				ui.Row(c).AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
					components.Spinner(c, components.SpinnerRing)
					components.Text(c, "Restoring your session…").TextColor(t.TextMuted)
				})
				return
			}
			ui.Column(c).Gap(t.Space(1)).Children(func() {
				components.Text(c, "Welcome back").FontSize(t.Rem(1.55)).Bold()
				components.Text(c, "Sign in to manage your jobs and live metrics.").TextColor(t.TextMuted)
			})
			if a.loginError != "" {
				errorBanner(c, a.loginError)
			}
			ui.Column(c).Gap(t.Space(1.5)).Children(func() {
				c.Key("login-username")
				components.TextBox(c, &a.username, components.TextBoxOptions{}).
					FillWidth().Disabled(a.loginBusy).Label("Username").Placeholder("Your demo username")
				c.Key("login-password")
				password := components.TextBox(c, &a.password, components.TextBoxOptions{}).
					FillWidth().Disabled(a.loginBusy).Label("Password").Placeholder("Your demo password").Password()
				if password.Submitted() {
					a.login()
				}
			})
			login := components.Button(c, "Sign in", components.ButtonPrimary).FillWidth().Disabled(a.loginBusy)
			if login.Clicked() {
				a.login()
			}
			if a.loginBusy {
				components.Text(c, "Signing in…").TextColor(t.TextMuted)
			}
			ui.Box(c).Padding(t.Space(3)).Radius(t.Radius).Background(t.Background).Children(func() {
				components.Text(c, "Demo accounts").Bold().FontSize(t.Rem(.82))
				components.Text(c, "alice / demo-alice   ·   bob / demo-bob").FontSize(t.Rem(.82)).TextColor(t.TextMuted)
			})
		})
	})
}

func (a *App) sidebar(c *ui.Context) {
	t := c.Theme()
	ui.Column(c).Width(226).FillHeight().Shrink(0).Background(t.Surface).Border(1, t.Border).
		Padding(t.Space(4), t.Space(3)).Gap(t.Space(4)).Children(func() {
		ui.Row(c).AlignItems(ui.Center).Gap(t.Space(2)).Padding(t.Space(1), t.Space(1)).Children(func() {
			brandMark(c)
			ui.Column(c).Gap(t.Space(.5)).Children(func() {
				components.Text(c, "MYGO").FontSize(t.Rem(.75)).Bold().TextColor(t.TextMuted)
				components.Text(c, "Operations Desk").Bold()
			})
		})
		ui.Scroll(c).Fill().MinWidth(0).Children(func() {
			components.Sidebar(c).Children(func() {
				components.SidebarSection(c, "NAVIGATION", func() {
					components.Tree(c, func() {
						operations := components.TreeItemWithLeading(c, "Operations", &a.operationsOpen,
							a.page == pageOverview || a.page == pageJobs, navIcon(lucide.Workflow(), a.page == pageOverview || a.page == pageJobs), func() {
								a.navigationLeaf(c, "Overview", pageOverview, lucide.LayoutDashboard())
								a.navigationLeaf(c, "Jobs", pageJobs, lucide.ListTodo())
							})
						if operations.Clicked() {
							a.operationsOpen = !a.operationsOpen
						}
						observe := components.TreeItemWithLeading(c, "Observe", &a.observeOpen, a.page == pageMetrics,
							navIcon(lucide.Activity(), a.page == pageMetrics), func() {
								a.navigationLeaf(c, "Live metrics", pageMetrics, lucide.ChartLine())
							})
						if observe.Clicked() {
							a.observeOpen = !a.observeOpen
						}
					})
				})
			})
		})
		if a.user != nil {
			ui.Row(c).FillWidth().AlignItems(ui.Center).Gap(t.Space(2)).Padding(t.Space(2)).
				Background(t.Background).Border(1, t.Border).Radius(t.Radius).Children(func() {
				ui.Box(c).Size(t.Space(8), t.Space(8)).Shrink(0).Center().Radius(t.Space(4)).
					Background(t.Accent.Alpha(.14)).Children(func() {
					components.Text(c, initials(a.user.Name)).Bold().TextColor(t.Accent)
				})
				ui.Column(c).Grow(1).MinWidth(0).Gap(t.Space(.5)).Children(func() {
					components.Text(c, a.user.Name).Bold().SingleLine().Ellipsis("…")
					components.Text(c, a.user.Role).FontSize(t.Rem(.78)).TextColor(t.TextMuted).SingleLine()
				})
			})
		}
	})
}

func (a *App) navigationLeaf(c *ui.Context, label string, target page, icon *ui.SVG) {
	item := components.TreeItemWithLeading(c, label, nil, a.page == target, navIcon(icon, a.page == target), nil)
	if item.Clicked() {
		a.route(target)
	}
}

func navIcon(icon *ui.SVG, active bool) func(*ui.Context, float32) {
	return func(c *ui.Context, size float32) {
		color := c.Theme().TextMuted
		if active {
			color = c.Theme().Accent
		}
		components.Icon(c, icon).Size(size, size).TextColor(color)
	}
}

func (a *App) compactNav(c *ui.Context) {
	t := c.Theme()
	ui.Row(c).FillWidth().MinWidth(0).Padding(t.Space(1.5), t.Space(3)).Gap(t.Space(1)).
		Background(t.Surface).Border(1, t.Border).Children(func() {
		a.mobileNavItem(c, "Overview", pageOverview, lucide.LayoutDashboard())
		a.mobileNavItem(c, "Jobs", pageJobs, lucide.ListTodo())
		a.mobileNavItem(c, "Metrics", pageMetrics, lucide.ChartLine())
	})
}

func (a *App) mobileNavItem(c *ui.Context, label string, target page, icon *ui.SVG) {
	c.Key("mobile-navigation-" + string(target))
	item := components.SidebarItem(c, label, icon, a.page == target).Grow(1).MinWidth(0)
	if item.Clicked() {
		a.route(target)
	}
}

func (a *App) header(c *ui.Context) {
	t := c.Theme()
	ui.Row(c).FillWidth().MinWidth(0).AlignItems(ui.Center).Gap(t.Space(3)).
		Padding(t.Space(4), t.Space(6)).Border(1, t.Border).Children(func() {
		ui.Column(c).Grow(1).MinWidth(0).Gap(t.Space(.5)).Children(func() {
			components.Text(c, "OPERATIONS  /  "+strings.ToUpper(a.pageTitle())).
				FontSize(t.Rem(.72)).Bold().TextColor(t.TextMuted).SingleLine()
			components.Text(c, a.pageTitle()).FontSize(t.Rem(1.45)).Bold()
			components.Text(c, a.pageDescription()).FontSize(t.Rem(.9)).TextColor(t.TextMuted)
		})
		ui.Column(c).AlignItems(ui.End).Gap(t.Space(1)).Children(func() {
			components.Badge(c, a.liveLabel(), components.BadgeOptions{Tone: a.liveTone(), Icon: lucide.Radio()})
			ui.Row(c).AlignItems(ui.Center).Gap(t.Space(1)).Children(func() {
				components.Text(c, a.user.Name).FontSize(t.Rem(.8)).TextColor(t.TextMuted).SingleLine()
				logout := components.Button(c, "Sign out", components.ButtonGhost).Disabled(a.logoutBusy)
				if logout.Clicked() {
					a.logout()
				}
			})
		})
	})
}

func (a *App) overviewPage(c *ui.Context) {
	t := c.Theme()
	ui.Row(c).FillWidth().Wrap().Gap(t.Space(2)).Children(func() {
		metricCard(c, "Total jobs", fmt.Sprint(len(a.jobs)), "Across this workspace", lucide.Layers(), t.Accent)
		metricCard(c, "Running", fmt.Sprint(countStatus(a.jobs, "running")), "Currently in progress", lucide.Activity(), t.Success)
		metricCard(c, "Queued", fmt.Sprint(countStatus(a.jobs, "queued")), "Waiting to start", lucide.Clock3(), t.Warning)
		metricCard(c, "Active now", fmt.Sprint(latestActive(a.metrics)), "Simulated live metric", lucide.Radio(), t.Accent)
	})
	a.chartCard(c, 188)
	a.jobsSection(c, a.jobs, true)
}

func (a *App) jobsPage(c *ui.Context) {
	t := c.Theme()
	ui.Row(c).FillWidth().Wrap().AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
		ui.Column(c).Grow(1).MinWidth(180).Gap(t.Space(.5)).Children(func() {
			components.Text(c, "Workspace jobs").FontSize(t.Rem(1.08)).Bold()
			components.Text(c, fmt.Sprintf("%d jobs · select a row to edit it", len(a.jobs))).TextColor(t.TextMuted)
		})
		if a.selectedJob() != nil {
			edit := components.Button(c, "Edit selected", components.ButtonSecondary)
			if edit.Clicked() {
				a.editSelected()
			}
		}
		refresh := components.Button(c, "Refresh", components.ButtonOutline).Label("Refresh jobs")
		if refresh.Clicked() {
			a.refreshJobs()
		}
		create := components.Button(c, "New job", components.ButtonPrimary)
		if create.Clicked() {
			a.newJob()
		}
	})
	a.jobsSection(c, a.jobs, false)
	if a.form.open {
		a.jobForm(c)
	}
}

func (a *App) metricsPage(c *ui.Context) {
	t := c.Theme()
	ui.Row(c).FillWidth().Wrap().Gap(t.Space(2)).Children(func() {
		metricCard(c, "Active workers", fmt.Sprint(latestActive(a.metrics)), "Simulated demo metric", lucide.Activity(), t.Success)
		metricCard(c, "Throughput", formatRate(latestThroughput(a.metrics)), "Simulated requests / min", lucide.Gauge(), t.Accent)
		metricCard(c, "Samples", fmt.Sprint(len(a.metrics)), "Rolling 60 second window", lucide.ChartLine(), t.Warning)
	})
	a.chartCard(c, 272)
}

func (a *App) jobsSection(c *ui.Context, jobs []protocol.Job, compact bool) {
	t := c.Theme()
	ui.Column(c).FillWidth().MinWidth(0).Gap(t.Space(3)).Padding(t.Space(4)).
		Background(t.Surface).Border(1, t.Border).Radius(t.Space(2)).Children(func() {
		if compact {
			ui.Row(c).FillWidth().AlignItems(ui.Center).Children(func() {
				components.Text(c, "Jobs").FontSize(t.Rem(1.05)).Bold().Grow(1)
				view := components.Button(c, "View all", components.ButtonGhost)
				if view.Clicked() {
					a.route(pageJobs)
				}
			})
		} else {
			components.Text(c, "Job queue").FontSize(t.Rem(1.05)).Bold()
		}
		if a.jobsError != "" {
			errorBanner(c, "Could not load jobs: "+a.jobsError)
			if components.Button(c, "Retry", components.ButtonOutline).Clicked() {
				a.refreshJobs()
			}
		}
		if a.jobsLoading && len(jobs) == 0 {
			ui.Row(c).AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
				components.Spinner(c, components.SpinnerRing)
				components.Text(c, "Loading jobs…").TextColor(t.TextMuted)
			})
			return
		}
		if len(jobs) == 0 {
			ui.Column(c).FillWidth().AlignItems(ui.Center).Gap(t.Space(1.5)).Padding(t.Space(6)).
				Background(t.Background).Radius(t.Radius).Children(func() {
				components.Icon(c, lucide.ListTodo()).Size(22, 22).TextColor(t.TextMuted)
				components.Text(c, "No jobs yet").Bold()
				components.Text(c, "Create a job to start building your queue.").TextColor(t.TextMuted)
				if !compact {
					create := components.Button(c, "Create your first job", components.ButtonPrimary)
					if create.Clicked() {
						a.newJob()
					}
				}
			})
			return
		}
		if compact && len(jobs) > 5 {
			jobs = jobs[:5]
		}
		tableHeight := min(50+float32(len(jobs))*52, 310)
		if tableHeight < 132 {
			tableHeight = 132
		}
		ui.ScrollBoth(c).FillWidth().Height(tableHeight).Children(func() {
			columns := []ui.TableColumn{
				{Title: "Job", ID: "name", Width: 240, MinWidth: 165},
				{Title: "Priority", ID: "priority", Width: 112, MinWidth: 88},
				{Title: "Status", ID: "status", Width: 128, MinWidth: 100},
			}
			components.Table(c, &a.tableState, columns, func() {
				for _, job := range jobs {
					job := job
					row := components.TableRow(c, job.ID, job.Name, a.selectedID == job.ID, func(col int) {
						switch col {
						case 0:
							ui.Column(c).MinWidth(0).FillWidth().Gap(t.Space(.5)).Padding(t.Space(1.5), t.Space(2)).Children(func() {
								components.Text(c, job.Name).Bold().SingleLine().Ellipsis("…")
								components.Text(c, "JOB-"+strings.ToUpper(shortID(job.ID))).
									FontSize(t.Rem(.72)).TextColor(t.TextMuted).SingleLine()
							})
						case 1:
							tone := components.BadgeNeutral
							if job.Priority >= 4 {
								tone = components.BadgeWarning
							}
							components.Badge(c, fmt.Sprintf("P%d", job.Priority), components.BadgeOptions{Tone: tone})
						case 2:
							components.Badge(c, titleStatus(job.Status), components.BadgeOptions{Tone: statusTone(job.Status)})
						}
					})
					if row.Clicked() {
						a.selectedID = job.ID
					}
				}
			})
		})
		if a.jobsLoading {
			components.Text(c, "Refreshing jobs…").FontSize(t.Rem(.8)).TextColor(t.TextMuted)
		}
	})
}

func (a *App) jobForm(c *ui.Context) {
	t := c.Theme()
	editing := a.form.id != ""
	ui.Column(c).FillWidth().MinWidth(0).Gap(t.Space(3)).Padding(t.Space(4)).
		Background(t.Surface).Border(1, t.Border).Radius(t.Space(2)).Children(func() {
		if editing {
			components.Text(c, "Edit job").FontSize(t.Rem(1.05)).Bold()
		} else {
			components.Text(c, "Create a job").FontSize(t.Rem(1.05)).Bold()
		}
		components.Text(c, "Changes are validated here and confirmed by the API.").TextColor(t.TextMuted)
		if a.form.err != "" {
			errorBanner(c, a.form.err)
		}
		ui.Row(c).FillWidth().Wrap().AlignItems(ui.End).Gap(t.Space(2)).Children(func() {
			ui.Column(c).Grow(1).MinWidth(205).Gap(t.Space(1)).Children(func() {
				components.Text(c, "Name").FontSize(t.Rem(.82)).Bold()
				c.Key("job-form-name")
				name := components.TextBox(c, &a.form.name, components.TextBoxOptions{}).
					FillWidth().Label("Job name").Placeholder("e.g. Nightly warehouse sync")
				if !editing {
					name.AutoFocus()
				}
				if name.Submitted() {
					a.saveJob()
				}
			})
			ui.Column(c).Width(152).MinWidth(132).Gap(t.Space(1)).Children(func() {
				components.Text(c, "Priority").FontSize(t.Rem(.82)).Bold()
				a.prioritySelect(c)
			})
			ui.Column(c).Width(170).MinWidth(145).Gap(t.Space(1)).Children(func() {
				components.Text(c, "Status").FontSize(t.Rem(.82)).Bold()
				a.statusSelect(c)
			})
		})
		ui.Row(c).Wrap().AlignItems(ui.Center).Gap(t.Space(1.5)).Children(func() {
			label := "Create job"
			if editing {
				label = "Save changes"
			}
			save := components.Button(c, label, components.ButtonPrimary).Disabled(a.savingJob)
			if save.Clicked() {
				a.saveJob()
			}
			cancel := components.Button(c, "Cancel", components.ButtonGhost).Disabled(a.savingJob)
			if cancel.Clicked() {
				a.form = jobForm{}
			}
			if a.savingJob {
				components.Text(c, "Saving…").TextColor(t.TextMuted)
			}
		})
	})
}

func (a *App) prioritySelect(c *ui.Context) {
	c.Key("job-form-priority")
	selectBox := components.Select(c, &a.form.priority)
	selectBox.Trigger.Label("Priority").FillWidth().Children(func() {
		components.Text(c, fmt.Sprintf("P%d", a.form.priority)).SingleLine()
	})
	selectBox.Popup(func(_ ui.Element) {
		for priority := 1; priority <= 5; priority++ {
			priority := priority
			item := selectBox.Item(priority)
			item.Label(fmt.Sprintf("Priority %d", priority)).Children(func() {
				components.Text(c, fmt.Sprintf("P%d  ·  %s", priority, priorityName(priority))).SingleLine()
			})
		}
	})
	if selectBox.Trigger.Changed() {
		a.form.err = ""
	}
}

func (a *App) statusSelect(c *ui.Context) {
	c.Key("job-form-status")
	selectBox := components.Select(c, &a.form.status)
	selectBox.Trigger.Label("Status").FillWidth().Children(func() {
		components.Text(c, titleStatus(a.form.status)).SingleLine()
	})
	selectBox.Popup(func(_ ui.Element) {
		for _, status := range []string{"queued", "running", "paused"} {
			status := status
			item := selectBox.Item(status)
			item.Label(titleStatus(status)).Children(func() {
				components.Text(c, titleStatus(status)).SingleLine()
			})
		}
	})
	if selectBox.Trigger.Changed() {
		a.form.err = ""
	}
}

func (a *App) chartCard(c *ui.Context, height float32) {
	t := c.Theme()
	ui.Column(c).FillWidth().MinWidth(0).Gap(t.Space(3)).Padding(t.Space(4)).
		Background(t.Surface).Border(1, t.Border).Radius(t.Space(2)).Children(func() {
		ui.Row(c).FillWidth().Wrap().AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
			ui.Column(c).Grow(1).MinWidth(180).Gap(t.Space(.5)).Children(func() {
				components.Text(c, "Live activity").FontSize(t.Rem(1.05)).Bold()
				components.Text(c, "Simulated demo data · authenticated event stream").
					FontSize(t.Rem(.82)).TextColor(t.TextMuted)
			})
			a.metricToggle(c, "Throughput", metricThroughput)
			a.metricToggle(c, "Active workers", metricActive)
		})
		if a.metricsError != "" {
			ui.Row(c).AlignItems(ui.Center).Gap(t.Space(1)).Children(func() {
				components.Icon(c, lucide.Radio()).Size(14, 14).TextColor(t.Warning)
				components.Text(c, a.metricsError).FontSize(t.Rem(.8)).TextColor(t.Warning)
			})
		}
		ui.Box(c).Key("live-metrics-chart").FillWidth().MinWidth(0).Children(func() {
			data, label := a.chartData()
			chart.Line(c, &a.metricState, data, chart.Options{
				Label:       label,
				Description: "Streaming simulated demo metrics from the authenticated backend. Use arrow keys to explore values.",
				PlotHeight:  height,
				EmptyText:   "Waiting for the first live sample…",
				FormatValue: func(value float64) string {
					if a.metricKind == metricThroughput {
						return formatRate(value)
					}
					return fmt.Sprintf("%.0f workers", value)
				},
				AnimationDuration: 220 * time.Millisecond,
			})
		})
		ui.Row(c).AlignItems(ui.Center).Gap(t.Space(1)).Children(func() {
			components.Icon(c, lucide.Info()).Size(13, 13).TextColor(t.TextMuted)
			components.Text(c, "Synthetic values are streamed by the local demo API; they are not production telemetry.").
				FontSize(t.Rem(.78)).TextColor(t.TextMuted)
		})
	})
}

func (a *App) metricToggle(c *ui.Context, label string, target metricKind) {
	variant := components.ButtonGhost
	if a.metricKind == target {
		variant = components.ButtonSecondary
	}
	c.Key(fmt.Sprintf("metric-toggle-%d", target))
	button := components.Button(c, label, variant)
	if button.Clicked() {
		a.metricKind = target
		a.metricState = chart.State{Index: -1}
	}
}

func (a *App) chartData() (chart.Data, string) {
	labels := make([]string, 0, len(a.metrics))
	values := make([]float64, 0, len(a.metrics))
	for _, metric := range a.metrics {
		labels = append(labels, time.UnixMilli(metric.Time).Format("15:04:05"))
		if a.metricKind == metricActive {
			values = append(values, float64(metric.Active))
		} else {
			values = append(values, metric.Throughput)
		}
	}
	label := "Throughput / min"
	series := chart.Series{ID: "throughput", Label: label, Values: values}
	if a.metricKind == metricActive {
		label = "Active workers"
		series = chart.Series{ID: "active", Label: label, Values: values}
	}
	return chart.Data{Labels: labels, Series: []chart.Series{series}}, label
}

func metricCard(c *ui.Context, label, value, detail string, icon *ui.SVG, accent ui.Color) {
	t := c.Theme()
	ui.Column(c).Grow(1).MinWidth(152).Gap(t.Space(2)).Padding(t.Space(3)).
		Background(t.Surface).Border(1, t.Border).Radius(t.Space(2)).Children(func() {
		ui.Row(c).FillWidth().AlignItems(ui.Center).Children(func() {
			components.Text(c, label).FontSize(t.Rem(.82)).TextColor(t.TextMuted).Grow(1)
			components.Icon(c, icon).Size(16, 16).TextColor(accent)
		})
		components.Text(c, value).FontSize(t.Rem(1.7)).Bold().SingleLine()
		components.Text(c, detail).FontSize(t.Rem(.78)).TextColor(t.TextMuted).SingleLine()
	})
}

func brandMark(c *ui.Context) {
	t := c.Theme()
	ui.Box(c).Size(t.Space(9), t.Space(9)).Shrink(0).Center().Radius(t.Space(2)).
		Background(t.Accent).Children(func() {
		components.Icon(c, lucide.Workflow()).Size(t.Space(5), t.Space(5)).TextColor(t.AccentText)
	})
}

func errorBanner(c *ui.Context, message string) {
	t := c.Theme()
	ui.Row(c).FillWidth().AlignItems(ui.Center).Gap(t.Space(1.5)).Padding(t.Space(2)).
		Background(t.Danger.Alpha(.1)).Border(1, t.Danger.Alpha(.25)).Radius(t.Radius).Children(func() {
		components.Icon(c, lucide.CircleAlert()).Size(15, 15).TextColor(t.Danger)
		components.Text(c, message).TextColor(t.Danger).FontSize(t.Rem(.84))
	})
}

func (a *App) liveLabel() string {
	if a.logoutBusy {
		return "SIGNING OUT"
	}
	if a.metricsError != "" {
		return "RECONNECTING"
	}
	if len(a.metrics) == 0 {
		return "CONNECTING"
	}
	return "LIVE DEMO"
}

func (a *App) liveTone() components.BadgeTone {
	if a.metricsError != "" {
		return components.BadgeWarning
	}
	if len(a.metrics) > 0 {
		return components.BadgeSuccess
	}
	return components.BadgeNeutral
}

func latestActive(metrics []protocol.Metrics) int {
	if len(metrics) == 0 {
		return 0
	}
	return metrics[len(metrics)-1].Active
}

func latestThroughput(metrics []protocol.Metrics) float64 {
	if len(metrics) == 0 {
		return 0
	}
	return metrics[len(metrics)-1].Throughput
}

func formatRate(value float64) string { return fmt.Sprintf("%.1f / min", value) }

func countStatus(jobs []protocol.Job, status string) int {
	n := 0
	for _, job := range jobs {
		if job.Status == status {
			n++
		}
	}
	return n
}

func titleStatus(status string) string {
	if status == "" {
		return "Unknown"
	}
	return strings.ToUpper(status[:1]) + status[1:]
}

func statusTone(status string) components.BadgeTone {
	switch status {
	case "running":
		return components.BadgeSuccess
	case "paused":
		return components.BadgeWarning
	default:
		return components.BadgeNeutral
	}
}

func priorityName(priority int) string {
	if priority >= 4 {
		return "Urgent"
	}
	if priority == 3 {
		return "Normal"
	}
	return "Low"
}

func shortID(id string) string {
	id = strings.TrimSpace(id)
	if len(id) > 8 {
		return id[:8]
	}
	return id
}

func initials(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return "?"
	}
	if len(parts) == 1 {
		return strings.ToUpper(string([]rune(parts[0])[0]))
	}
	return strings.ToUpper(string([]rune(parts[0])[0]) + string([]rune(parts[len(parts)-1])[0]))
}
