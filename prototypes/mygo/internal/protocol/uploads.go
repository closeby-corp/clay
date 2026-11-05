package protocol

type UploadedFile struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Size       int64  `json:"size"`
	Type       string `json:"type"`
	UploadedAt string `json:"uploadedAt"`
}

type UploadList struct {
	Files           []UploadedFile `json:"files"`
	LifetimeUploads int64          `json:"lifetimeUploads"`
}
