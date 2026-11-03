import { ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

type Props = { name: string; imageUrl: string | null; trusted: boolean };

export function ProfileHeader({ name, imageUrl, trusted }: Props) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Avatar name={name} imageUrl={imageUrl} size={64} />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
        {trusted && (
          <Badge tone="success">
            <ShieldCheck size={14} /> Trusted lender
          </Badge>
        )}
      </div>
    </div>
  );
}
