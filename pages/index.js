import Head from 'next/head';
import UnifiedQuiz from '../components/UnifiedQuiz';

export default function Home() {
  return (
    <>
      <Head>
        <title>Cyber Security Quiz</title>
      </Head>
      <main className="p-8">
        <UnifiedQuiz />
      </main>
    </>
  );
}