import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface CommentCardProps {
  authorName: string;
  content: string;
  timestamp: string;
  role?: string;
}

export function CommentCard({ authorName, content, timestamp, role }: CommentCardProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">{authorName}</span>
              {role && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {role}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{content}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
