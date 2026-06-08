import { getRegistrationData } from "./actions";
import { RegisterClient } from "./register-client";

export const metadata = {
  title: "Pendaftaran Siswa | Sports Center",
  description: "Daftarkan putra/putri Anda ke akademi basket kami",
};

export default async function RegisterPage() {
  const data = await getRegistrationData().catch(() => ({
    branches: [],
    classes: [],
    businessName: "Sports Center",
  }));

  return <RegisterClient {...data} />;
}
