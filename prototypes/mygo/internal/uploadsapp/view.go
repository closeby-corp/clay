package uploadsapp

import (
	"fmt"
	"strings"
	"time"

	"github.com/closeby-corp/clay/prototypes/mygo/internal/client"
	"github.com/egoist/mygo/ui"
	"github.com/oneo-me/onevra/source/components"
	"github.com/oneo-me/onevra/source/icons/lucide"
	"github.com/oneo-me/onevra/source/theme"
)

func (a *App) View(c *ui.Context) {
	theme.Apply(c)
	t := c.Theme()
	if a.user == nil {
		a.loginView(c)
		return
	}
	ui.Column(c).Fill().MinWidth(0).Background(t.Background).Children(func() {
		a.header(c)
		ui.Scroll(c).Fill().MinWidth(0).Children(func() {
			ui.Column(c).FillWidth().MinWidth(0).Padding(t.Space(5), t.Space(6), t.Space(8)).Gap(t.Space(4)).Children(func() {
				a.intro(c)
				if a.workflowError != "" {
					messageBanner(c, a.workflowError, true)
					if !a.loadingFiles && !a.busy {
						if components.Button(c, "Retry", components.ButtonOutline).Clicked() {
							a.refreshUploads()
						}
					}
				}
				if a.notice != "" {
					messageBanner(c, a.notice, false)
				}
				ui.Row(c).FillWidth().Wrap().AlignItems(ui.Start).Gap(t.Space(3)).Children(func() {
					a.filesPanel(c)
					a.detailsPanel(c)
				})
			})
		})
	})
	if a.deleteConfirm {
		selected := a.selectedFile()
		name := "this file"
		if selected != nil {
			name = selected.Name
		}
		result := components.AlertDialog(c, &a.deleteConfirm, components.AlertDialogOptions{
			Title:        "Delete uploaded copy?",
			Message:      fmt.Sprintf("%s will be removed from this account. The original file on your device is unchanged.", name),
			ConfirmLabel: "Delete file",
			CancelLabel:  "Keep file",
		})
		if result == components.DialogConfirmed {
			a.deleteSelected()
		}
	}
}

func (a *App) loginView(c *ui.Context) {
	t := c.Theme()
	ui.Column(c).Fill().Padding(t.Space(6)).AlignItems(ui.Center).Justify(ui.Center).Children(func() {
		ui.Column(c).Width(420).MaxWidthPercent(100).MinWidth(0).Padding(t.Space(6)).Gap(t.Space(4)).
			Background(t.Surface).Border(1, t.Border).Radius(t.Space(3)).Children(func() {
			ui.Row(c).AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
				brandMark(c)
				ui.Column(c).Gap(t.Space(.5)).Children(func() {
					components.Text(c, "Clay Uploads").FontSize(t.Rem(1.2)).Bold()
					components.Text(c, "MYGO FILE WORKFLOW").FontSize(t.Rem(.75)).Bold().TextColor(t.TextMuted)
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
				components.Text(c, "Sign in to your files").FontSize(t.Rem(1.5)).Bold()
				components.Text(c, "Upload, download, and manage real files.").TextColor(t.TextMuted)
			})
			if a.loginError != "" {
				messageBanner(c, a.loginError, true)
			}
			if a.logoutBusy {
				ui.Row(c).AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
					components.Spinner(c, components.SpinnerRing)
					components.Text(c, "Signing out…").TextColor(t.TextMuted)
				})
			}
			ui.Column(c).Gap(t.Space(1.5)).Children(func() {
				c.Key("uploads-login-username")
				components.TextBox(c, &a.username, components.TextBoxOptions{}).
					FillWidth().Disabled(a.loginBusy || a.logoutBusy).Label("Username").Placeholder("Your username")
				c.Key("uploads-login-password")
				password := components.TextBox(c, &a.password, components.TextBoxOptions{}).
					FillWidth().Disabled(a.loginBusy || a.logoutBusy).Label("Password").Placeholder("Your password").Password()
				if password.Submitted() {
					a.login()
				}
			})
			login := components.Button(c, "Sign in", components.ButtonPrimary).FillWidth().Disabled(a.loginBusy || a.logoutBusy)
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

func (a *App) header(c *ui.Context) {
	t := c.Theme()
	ui.Row(c).FillWidth().MinWidth(0).Wrap().AlignItems(ui.Center).Gap(t.Space(2)).
		Padding(t.Space(3), t.Space(5)).Background(t.Surface).Border(1, t.Border).Children(func() {
		ui.Row(c).Grow(1).MinWidth(180).AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
			brandMark(c)
			ui.Column(c).Gap(t.Space(.5)).Children(func() {
				components.Text(c, "CLAY / MYGO").FontSize(t.Rem(.72)).Bold().TextColor(t.TextMuted)
				components.Text(c, "Uploads").FontSize(t.Rem(1.08)).Bold()
			})
		})
		ui.Row(c).AlignItems(ui.Center).Gap(t.Space(1.5)).Children(func() {
			components.Text(c, a.user.Name).FontSize(t.Rem(.86)).TextColor(t.TextMuted).SingleLine()
			logout := components.Button(c, "Sign out", components.ButtonGhost).Disabled(a.logoutBusy)
			if logout.Clicked() {
				a.logout()
			}
		})
	})
}

func (a *App) intro(c *ui.Context) {
	t := c.Theme()
	ui.Row(c).FillWidth().Wrap().AlignItems(ui.End).Gap(t.Space(3)).Children(func() {
		ui.Column(c).Grow(1).MinWidth(220).Gap(t.Space(1)).Children(func() {
			components.Badge(c, "Clay File Upload workflow / real files", components.BadgeOptions{Tone: components.BadgeAccent, Icon: lucide.FileUp()})
			components.Text(c, "Your files, ready when you are").FontSize(t.Rem(1.75)).Bold()
			components.Text(c, "Upload real files and manage copies stored by this account.").TextColor(t.TextMuted)
		})
		ui.Row(c).MinWidth(230).AlignItems(ui.Center).Gap(t.Space(2)).Padding(t.Space(2.5), t.Space(3)).
			Background(t.Surface).Border(1, t.Border).Radius(t.Radius).Children(func() {
			components.Icon(c, lucide.Files()).Size(t.Space(5), t.Space(5)).TextColor(t.Accent)
			ui.Column(c).Gap(t.Space(.5)).Children(func() {
				components.Text(c, fmt.Sprint(a.lifetimeUploads)).FontSize(t.Rem(1.45)).Bold()
				components.Text(c, "Lifetime uploads").FontSize(t.Rem(.78)).TextColor(t.TextMuted)
				components.Text(c, "Across this account · not reduced by deletes").FontSize(t.Rem(.7)).TextColor(t.TextMuted)
			})
		})
	})
}

func (a *App) filesPanel(c *ui.Context) {
	t := c.Theme()
	ui.Column(c).Grow(1).MinWidth(290).MaxWidthPercent(100).Gap(t.Space(3)).Padding(t.Space(4)).
		Background(t.Surface).Border(1, t.Border).Radius(t.Space(2)).Children(func() {
		ui.Row(c).FillWidth().Wrap().AlignItems(ui.Center).Gap(t.Space(2)).Children(func() {
			ui.Column(c).Grow(1).MinWidth(180).Gap(t.Space(.5)).Children(func() {
				components.Text(c, "Files in this window").FontSize(t.Rem(1.08)).Bold()
				components.Text(c, "This list is private to the current app window.").FontSize(t.Rem(.82)).TextColor(t.TextMuted)
			})
			if a.loadingFiles && len(a.files) > 0 {
				ui.Row(c).AlignItems(ui.Center).Gap(t.Space(1)).Children(func() {
					components.Spinner(c, components.SpinnerRing)
					components.Text(c, "Refreshing…").FontSize(t.Rem(.8)).TextColor(t.TextMuted)
				})
			}
			refresh := components.Button(c, "Refresh", components.ButtonOutline).Disabled(a.busy || a.loadingFiles)
			if refresh.Clicked() {
				a.refreshUploads()
			}
		})
		ui.Row(c).FillWidth().Wrap().AlignItems(ui.Center).Gap(t.Space(2)).Padding(t.Space(3)).
			Background(t.Background).Border(1, t.Border).Radius(t.Radius).Children(func() {
			ui.Column(c).Grow(1).MinWidth(200).Gap(t.Space(.5)).Children(func() {
				components.Text(c, "Upload files").Bold()
				components.Text(c, fmt.Sprintf("Images, TXT, MD, PDF, or CSV · up to %d files, 5 MiB each", client.MaxUploadFiles)).FontSize(t.Rem(.82)).TextColor(t.TextMuted)
			})
			if a.busy && a.canCancel {
				cancel := components.Button(c, "Cancel transfer", components.ButtonGhost)
				if cancel.Clicked() {
					a.cancelTransfer()
				}
			} else {
				choose := components.Button(c, "Choose files", components.ButtonPrimary).Disabled(a.busy || a.loadingFiles || a.selectingFiles)
				if choose.Clicked() {
					a.chooseFiles()
				}
			}
		})
		if a.busy {
			ui.Row(c).AlignItems(ui.Center).Gap(t.Space(1.5)).Children(func() {
				components.Spinner(c, components.SpinnerRing)
				components.Text(c, a.busyLabel+"…").TextColor(t.TextMuted)
			})
		}
		if a.loadingFiles && len(a.files) == 0 {
			ui.Row(c).AlignItems(ui.Center).Gap(t.Space(2)).Padding(t.Space(4)).Children(func() {
				components.Spinner(c, components.SpinnerRing)
				components.Text(c, "Loading files for this window…").TextColor(t.TextMuted)
			})
			return
		}
		if len(a.files) == 0 {
			ui.Column(c).FillWidth().AlignItems(ui.Center).Gap(t.Space(1)).Padding(t.Space(6)).
				Background(t.Background).Radius(t.Radius).Children(func() {
				components.Icon(c, lucide.Files()).Size(22, 22).TextColor(t.TextMuted)
				components.Text(c, "No uploads in this window").Bold()
				components.Text(c, "Choose a file to add your first upload.").TextColor(t.TextMuted)
			})
			return
		}
		ui.Column(c).FillWidth().Gap(t.Space(1)).Children(func() {
			for i := range a.files {
				file := a.files[i]
				c.Key("upload-row-" + file.ID)
				ui.Row(c).FillWidth().MinWidth(0).AlignItems(ui.Center).Gap(t.Space(1.5)).Padding(t.Space(1.5)).
					Background(t.Background).Border(1, t.Border).Radius(t.Radius).Children(func() {
					components.Icon(c, lucide.FileText()).Size(t.Space(5), t.Space(5)).Shrink(0).TextColor(t.Accent)
					selectButton := components.Button(c, file.Name, components.ButtonGhost).Grow(1).MinWidth(0).Disabled(a.busy)
					if selectButton.Clicked() {
						a.selectedAt(file.ID)
					}
					components.Text(c, fmt.Sprintf("%s · %s", formatSize(file.Size), formatDate(file.UploadedAt))).
						FontSize(t.Rem(.75)).TextColor(t.TextMuted).SingleLine()
				})
			}
		})
	})
}

func (a *App) detailsPanel(c *ui.Context) {
	t := c.Theme()
	file := a.selectedFile()
	ui.Column(c).Width(310).MinWidth(260).MaxWidthPercent(100).Gap(t.Space(3)).Padding(t.Space(4)).
		Background(t.Surface).Border(1, t.Border).Radius(t.Space(2)).Children(func() {
		components.Text(c, "File details").FontSize(t.Rem(1.08)).Bold()
		if file == nil {
			ui.Column(c).FillWidth().AlignItems(ui.Center).Gap(t.Space(1)).Padding(t.Space(4)).
				Background(t.Background).Radius(t.Radius).Children(func() {
				components.Icon(c, lucide.FileText()).Size(22, 22).TextColor(t.TextMuted)
				components.Text(c, "Select a file to see its details.").TextColor(t.TextMuted)
			})
			return
		}
		ui.Column(c).FillWidth().Gap(t.Space(2)).Padding(t.Space(3)).
			Background(t.Background).Border(1, t.Border).Radius(t.Radius).Children(func() {
			components.Text(c, file.Name).Bold()
			metadata(c, "Size", formatSize(file.Size))
			metadata(c, "Type", displayType(file.Type))
			metadata(c, "Uploaded", formatDate(file.UploadedAt))
		})
		ui.Column(c).FillWidth().Gap(t.Space(1.5)).Children(func() {
			download := components.Button(c, "Download", components.ButtonPrimary).FillWidth().Disabled(a.busy)
			if download.Clicked() {
				a.downloadSelected()
			}
			copy := components.Button(c, "Copy name", components.ButtonOutline).FillWidth().Disabled(a.busy)
			if copy.Clicked() {
				a.copySelectedName()
			}
			remove := components.Button(c, "Delete", components.ButtonGhost).FillWidth().Disabled(a.busy)
			if remove.Clicked() {
				a.deleteConfirm = true
			}
		})
		components.Text(c, "Delete removes only the uploaded copy.").FontSize(t.Rem(.78)).TextColor(t.TextMuted)
	})
}

func metadata(c *ui.Context, label, value string) {
	t := c.Theme()
	ui.Row(c).FillWidth().Wrap().Gap(t.Space(1)).Children(func() {
		components.Text(c, label).FontSize(t.Rem(.78)).TextColor(t.TextMuted)
		components.Text(c, value).FontSize(t.Rem(.82)).Bold()
	})
}

func messageBanner(c *ui.Context, message string, isError bool) {
	t := c.Theme()
	color := t.Success
	icon := lucide.Check()
	if isError {
		color, icon = t.Danger, lucide.CircleAlert()
	}
	ui.Row(c).FillWidth().AlignItems(ui.Center).Gap(t.Space(1.5)).Padding(t.Space(2)).
		Background(color.Alpha(.1)).Border(1, color.Alpha(.25)).Radius(t.Radius).Children(func() {
		components.Icon(c, icon).Size(15, 15).TextColor(color)
		components.Text(c, message).TextColor(color).FontSize(t.Rem(.84))
	})
}

func brandMark(c *ui.Context) {
	t := c.Theme()
	ui.Box(c).Size(t.Space(9), t.Space(9)).Shrink(0).Center().Radius(t.Space(2)).
		Background(t.Accent).Children(func() {
		components.Icon(c, lucide.FileUp()).Size(t.Space(5), t.Space(5)).TextColor(t.AccentText)
	})
}

func formatSize(size int64) string {
	if size < 1024 {
		return fmt.Sprintf("%d B", size)
	}
	if size < 1<<20 {
		return fmt.Sprintf("%.1f KB", float64(size)/1024)
	}
	return fmt.Sprintf("%.1f MB", float64(size)/(1<<20))
}

func displayType(contentType string) string {
	contentType, _, _ = strings.Cut(contentType, ";")
	if contentType == "" {
		return "Unknown"
	}
	return contentType
}

func formatDate(value string) string {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return value
	}
	return parsed.Local().Format("Jan 2, 2006 · 3:04 PM")
}
