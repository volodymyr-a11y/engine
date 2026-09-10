export default function Home() {
  return (
    <main>
      <section className="welcome" aria-labelledby="welcome-title">
        <span className="badge">Next.js + TypeScript</span>
        <h1 id="welcome-title">Почнімо створювати.</h1>
        <p>
          Ваша стартова сторінка готова. Відредагуйте
          {" "}<code>src/app/page.tsx</code>, щоб втілити свою ідею.
        </p>
        <a href="https://nextjs.org/docs">Документація Next.js <span aria-hidden="true">↗</span></a>
      </section>
    </main>
  );
}
