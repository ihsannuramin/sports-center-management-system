export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getPromotions } from "@/app/actions/promos";
import { PromosClient } from "./promos-client";

export default async function PromosPage() {
  const promos = await getPromotions().catch(() => []);
  return (
    <>
      <Header title="Promo & Diskon" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <PromosClient promos={promos} />
      </div>
    </>
  );
}
