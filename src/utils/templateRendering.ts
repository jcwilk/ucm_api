import { Eta } from "../deps.ts";

export type RenderedTranscript = {
  data: Record<string,string>,
  transcript: string,
  templateName: string,
}

export function renderTranscriptTemplate(templateName: string, data: Record<string, string>) {
  const eta = new Eta({ autoEscape: false, views: Deno.cwd()+'/src/templates/' })

  return {
    transcript: eta.render(templateName, data),
    data,
    templateName,
  };
}
