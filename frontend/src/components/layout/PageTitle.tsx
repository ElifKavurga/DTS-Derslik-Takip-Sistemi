type PageTitleProps = {
  title: string;
  description?: string;
};

export const PageTitle = ({ title, description }: PageTitleProps) => {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  );
};
