/** Metadados de ficheiro em `ascii/scenes/**` (manifest gerado em tempo de build/dev). */
export type AsciiSceneFileMeta = {
  /** artKey — basename sem `.txt` */
  key: string;
  /** Caminho relativo a `ascii/scenes/` */
  path: string;
  mtimeMs: number;
};
