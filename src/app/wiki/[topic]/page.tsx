import { notFound } from "next/navigation";
import { wikiTopics, getTopicBySlug, getAllTopicSlugs } from "@/lib/wiki-content";
import { WikiView } from "@/components/WikiView";

export function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ topic: slug }));
}

export default async function WikiTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const currentTopic = getTopicBySlug(topic);

  if (!currentTopic) {
    notFound();
  }

  const topicList = wikiTopics.map((t) => ({
    slug: t.slug,
    title: t.title,
    category: t.category,
  }));

  return <WikiView topics={topicList} currentTopic={currentTopic} />;
}
