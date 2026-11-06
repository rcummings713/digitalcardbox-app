import { templates } from "../modules/media/catalog";
export function TemplateCredit({ id }: { id: string }) {
  const item = templates.find((t) => t.id === id);
  return item && "credit" in item ? (
    <p className="small template-credit">
      {item.credit} ·{" "}
      <a href={item.licenseUrl} target="_blank" rel="noreferrer">
        License
      </a>{" "}
      ·{" "}
      <a href={item.sourceUrl} target="_blank" rel="noreferrer">
        Source
      </a>
    </p>
  ) : null;
}
