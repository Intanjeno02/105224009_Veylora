export interface DemoCredential {
  username: string;
  password: string;
  label: string;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    username: "admin",
    password: "password123",
    label: "Akun Demo Utama (Administrator)",
  },
  {
    username: "intan",
    password: "password123",
    label: "Akun Demo Mahasiswa (Intan)",
  },
];

