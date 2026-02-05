import { useGhostStore } from "@/stores/useGhostStore"; // Updated import
import { cn, formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PauseCircle, Clock, CheckCircle } from "lucide-react"; // Add CheckCircle

export function ContactList() {
  const { contacts, activeContactId, setActiveContact } = useGhostStore(); // Updated import

  return (
    <div className="w-80 border-r border-border h-full flex flex-col bg-card/50">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-mono font-bold text-muted-foreground uppercase tracking-wider">
          Targets ({contacts.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => setActiveContact(contact.id)}
            className={cn(
              "flex items-center p-3 gap-3 cursor-pointer hover:bg-accent/50 transition-all border-b border-border/40",
              activeContactId === contact.id && "bg-accent border-l-2 border-l-primary"
            )}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={contact.profilePicUrl || ''} />
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {contact.name?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              {contact.isPaused && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <PauseCircle className="w-4 h-4 text-amber-500 fill-amber-950" />
                </div>
              )}
              {/* NEW: Directive Status Indicator */}
              {!contact.isPaused && contact.directiveStatus === 'EXECUTING' && (
                <div className="absolute top-0 -right-1 bg-background rounded-full p-0.5">
                  <Clock className="w-4 h-4 text-blue-500 fill-blue-950 animate-pulse" />
                </div>
              )}
              {!contact.isPaused && contact.directiveStatus === 'COMPLETED' && (
                <div className="absolute top-0 -right-1 bg-background rounded-full p-0.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-950" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-sm truncate text-foreground/90">
                  {contact.name || contact.pushName || contact.id}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatTime(contact.lastInteraction)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 rounded-sm font-mono text-muted-foreground border-border">
                  {contact.semanticProfile || 'NEUTRO'}
                </Badge>
                {contact.activeDirective && contact.directiveStatus === 'EXECUTING' && (
                  <Badge variant="warning" className="text-[9px] px-1 py-0 h-4 rounded-sm font-mono animate-pulse">
                    MISSION ACTIVE
                  </Badge>
                )}
                {contact.activeDirective && contact.directiveStatus === 'COMPLETED' && (
                  <Badge variant="success" className="text-[9px] px-1 py-0 h-4 rounded-sm font-mono">
                    MISSION COMPLETE
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
