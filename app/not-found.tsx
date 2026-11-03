import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-accent px-5 py-6 text-white sm:px-6">
      <Image
        src="/images/pravilo-prioridad-inversion-total.jpg"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover opacity-40 mix-blend-multiply"
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Volver al inicio">
          <Image src="/images/logo-transparent.png" alt="PRAVILO ARG" width={900} height={176} className="h-7 w-auto" />
        </Link>
        <div className="my-auto py-16">
          <p className="label text-white/80">Error 404</p>
          <h1 className="display mt-3 text-[24vw] sm:text-[11rem]">
            Página
            <br />
            dada vuelta
          </h1>
          <p className="mt-5 max-w-md text-lg font-medium text-white/90">
            Esta página no existe o se movió. Volvé al inicio y reservá tu
            sesión desde ahí.
          </p>
          <Link href="/" className="btn btn-white mt-8">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
