declare module 'screenshot-desktop' {
  export interface ScreenshotOptions {
    format?: 'png' | 'jpg';
    filename?: string;
  }
  function screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  export default screenshot;
}
