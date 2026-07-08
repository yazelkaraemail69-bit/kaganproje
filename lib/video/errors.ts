/** Thrown by any step of the script -> video pipeline (TTS, image gen, Runway, ffmpeg). */
export class VideoGeneratorError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "VideoGeneratorError";
    this.status = status;
  }
}
