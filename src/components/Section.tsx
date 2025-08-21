export default function Section({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-page my-8 md:my-12">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
