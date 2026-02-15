export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="-mx-6 -my-6">{children}</div>;
}
