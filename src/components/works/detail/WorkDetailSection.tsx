import { WorkTextSection } from "@/types/works";

interface Props {
  text: WorkTextSection;
  viewMode: "visual" | "lectura";
}

export default function WorkDetailSection({ text, viewMode }: Props) {
  return (
    <section
      className={`w-full ${viewMode === "visual"
        ? "px-6 md:px-12 lg:px-24 pb-32 md:pb-48 lg:pb-56 flex flex-col md:flex-row gap-12 lg:gap-24"
        : "flex flex-col gap-12 w-full pb-32 md:pb-48 lg:pb-56"
        }`}
    >
      {/*
        Columna Esquerra (Número i Títol de secció)
        Nota: `md:sticky` perquè quedi a la vista mentre l'usuari llegeix la columna
        dreta, però amb `top-32` (≈128px) per evitar la col·lisió amb el Header fixed
        (que té ~80-90px d'alçada amb padding py-8). El número i el títol son
        "ancla" mentre el lector progressa per la columna dreta.
      */}
      <div className={`${viewMode === "visual" ? "w-full md:w-5/12 flex flex-col gap-8 md:sticky md:top-32 md:self-start" : "w-full flex flex-col gap-6"}`}>
        <span className="text-text-main font-sans text-xl">{text.number}</span>
        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-text-secondary max-w-[150px]">
          {text.title}
        </h2>
      </div>

      {/* Columna Dreta (Heading, Descripció, i Llista) */}
      <div className={`${viewMode === "visual" ? "w-full md:w-7/12 flex flex-col" : "w-full flex flex-col"}`}>
        <div className="flex flex-col gap-8 w-full">
          <h3 className={`font-medium tracking-tight text-text-main ${viewMode === "visual" ? "text-heading-h1" : "text-heading-h1"}`}>
            {text.heading}
          </h3>
          {/*
            text-body-lg (24/18/14 px segons viewport) + max-w-[640px] per
            mantenir ~75ch de línia òptima a desktops amples. Substitueix
            text-body-xl (32 px font-light) que feia el body massa emfàtic
            i poc llegible en blocs llargs — alineat amb Motto.
            leading-relaxed (1.625) sobreescriu el line-height del token
            (que era 1.33 — massa tancat per a body llarg) per donar
            més respiració vertical sense tocar el token global.
          */}
          {/* `description` ara és HTML (RichTextEditor): pot contenir
              <strong>, <em>, <u>, <a>, <ul>/<ol>/<li>. Usem prose per
              estilitzar inline marks.
              prose-lg lg:prose-xl puja la tipografia del prose a 18-20px
              (substitueix el text-body-lg que era anul·lat pel prose).
              prose-p:leading-relaxed manté la respiració vertical.
              Així el paràgraf i les llistes (text-body-md, 20px desktop)
              queden alineats — sense salt de mida entre body i llistes. */}
          <div
            className={`prose prose-neutral prose-lg lg:prose-xl max-w-[640px] text-text-secondary
              prose-p:my-0 prose-p:leading-normal
              prose-strong:text-text-main prose-strong:font-semibold
              prose-em:text-text-main prose-a:text-text-main prose-a:underline hover:prose-a:text-accent
              ${viewMode === "visual" ? "" : ""}`}
            dangerouslySetInnerHTML={{ __html: text.description }}
          />
        </div>

        {text.listDetails && text.listDetails.length > 0 && (
          <div className="w-full pt-24">
            {/* h4 baixa a text-body-lg font-medium per harmonitzar amb el body */}
            <h4 className="font-medium text-text-main text-body-lg mb-6">Details</h4>
            <div className="flex flex-col w-full max-w-[640px]">
              {text.listDetails.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-t border-text-main/10">
                  <span className="text-text-secondary text-body-md w-full sm:w-1/2">{item.label}</span>
                  <span className="text-text-main text-body-md sm:w-1/2 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {text.listItems && text.listItems.length > 0 && text.listType === "what-we-did" && (
          <div className="w-full pt-16">
            {/* h4 baixa a text-body-lg font-medium per harmonitzar amb el body */}
            <h4 className="font-medium text-text-main text-body-lg mb-6">(El que vam fer)</h4>
            {/*
              text-body-lg + leading-relaxed (mateix tractament que el body
              paragraph). gap-5 (20px) entre items perquè cada bullet pugui
              respirar sense apropar-se a la línia anterior. max-w-[640px]
              perquè una línia llarga no estiri tot el bloc.
              marker:text-text-secondary perquè el bullet hereti color secundari.
            */}
            <ul className="flex flex-col gap-5 list-disc list-outside pl-6 text-text-secondary text-body-md leading-normal max-w-[640px] marker:text-text-secondary">
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