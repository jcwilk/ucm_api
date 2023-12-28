import { Eta } from "../deps.ts";

export type RenderedTranscript = {
  transcript: string,
  templateName: string,
}

export function renderTranscriptTemplate(templateName: string, data: Record<string, string | boolean>) {
  const eta = new Eta({ autoEscape: false, rmWhitespace: false, autoTrim: false, views: Deno.cwd()+'/src/templates/' })

  return {
    transcript: eta.render(templateName, data),
    templateName,
  };
}
