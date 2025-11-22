declare module "canvas-confetti" {
  export interface Options {
    [key: string]: unknown;
  }

  export interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
    [key: string]: unknown;
  }

  export interface CreateTypes {
    (options?: Options): void;
    reset?: () => void;
  }

  declare function confetti(options?: Options): void;
  declare namespace confetti {
    function create(canvas: HTMLCanvasElement, options?: GlobalOptions): CreateTypes;
  }

  export default confetti;
}
