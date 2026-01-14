import { Loader } from "@/components/loader";

export default async function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader />
    </div>
  );
}