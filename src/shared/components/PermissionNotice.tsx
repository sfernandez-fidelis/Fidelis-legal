export function PermissionNotice({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
      {message}
    </div>
  );
}
