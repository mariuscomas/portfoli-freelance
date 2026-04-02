import { WorkTextSection } from "@/types/works";

interface Props {
  text: WorkTextSection;
  viewMode: "visual" | "lectura";
}

export default function WorkDetailSection({ text, viewMode }: Props) {
  return (
    <section
      className={`w-full ${viewMode === "visual"
        ? "px-6 md:px-12 lg:px-24 pb-16 md:pb-32 flex flex-col md:flex-row gap-12 lg:gap-24"
        : "flex flex-col gap-12 w-full pb-16 md:pb-32"
        }`}
    >
      {/* Columna Esquerra (Número i Títol de secció) */}
      <div className={`${viewMode === "visual" ? "w-full md:w-5/12 flex flex-col gap-8 md:gap-16 pt-2" : "w-full flex flex-col gap-6 pt-2"}`}>
        <span className="text-text-main font-sans text-xl">{text.number}</span>
        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-text-muted max-w-[150px]">
          {text.title}
        </h2>
      </div>

      {/* Columna Dreta (Heading, Descripció, i Llista) */}
      <div className={`${viewMode === "visual" ? "w-full md:w-7/12 flex flex-col" : "w-full flex flex-col"}`}>
        <div className="flex flex-col gap-8 w-full">
          <h3 className={`font-medium tracking-tight text-text-main ${viewMode === "visual" ? "text-heading-h1" : "text-heading-h1"}`}>
            {text.heading}
          </h3>
          <p className={`text-text-muted ${viewMode === "visual" ? "text-body-lg" : "text-body-lg"}`}>
            {text.description}
          </p>
        </div>

        {text.listDetails && text.listDetails.length > 0 && (
          <div className="w-full pt-24">
            <h4 className="font-medium text-text-main text-body-lg mb-8">Details</h4>
            <div className="flex flex-col w-full">
              {text.listDetails.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-t border-text-main/10">
                  <span className="text-text-muted text-body-lg w-full sm:w-1/2">{item.label}</span>
                  <span className="text-text-main text-body-lg sm:w-1/2 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {text.listItems && text.listItems.length > 0 && text.listType === "what-we-did" && (
          <div className="w-full pt-16">
            <h4 className="font-medium text-text-main text-body-lg mb-8">(El que vam fer)</h4>
            <ul className="flex flex-col gap-3 list-disc list-inside text-text-muted text-body-lg">
              {text.listItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}