import { page, Component } from '@ralph/core';

@page('/examples/upload')
export class FileUploadExample extends Component {
  render(): string {
    return `
      <div class="container mx-auto max-w-md p-6">
        <div class="flex flex-col gap-4">
          <h1 class="text-3xl font-bold">File Upload</h1>
          
          <div class="card bordered shadow">
            <div class="card-body p-4 space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Select file</span>
                </label>
                <input type="file" name="file" class="file-input file-input-bordered w-full" />
              </div>
              
              <button class="btn btn-primary" onclick="console.log('Start upload')">Upload</button>
              
              <!-- Progress bar -->
              <div class="w-full">
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium">Progress</span>
                  <span class="text-sm font-medium">0%</span>
                </div>
                <progress class="progress progress-primary w-full" value="0" max="100"></progress>
              </div>
              
              <!-- File list -->
              <h3 class="font-bold">Uploaded Files:</h3>
              <div class="flex items-center justify-between">
                <span>document.pdf</span>
                <button class="btn btn-sm btn-ghost text-error" onclick="console.log('Delete file')">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
