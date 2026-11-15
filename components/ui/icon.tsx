import {
  Activity,
  Award,
  BookOpen,
  Bone,
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  Dumbbell,
  Ear,
  Eye,
  Footprints,
  Gauge,
  GraduationCap,
  Hand,
  HandHeart,
  Handshake,
  Heart,
  House,
  Layers,
  Lightbulb,
  MapPin,
  MessageCircle,
  Move,
  PersonStanding,
  Repeat,
  Route,
  ScanSearch,
  SearchCheck,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideProps,
} from "lucide-react";

/**
 * Icons referenced by name from the content files (so content stays plain
 * data). Add an entry here to make a new icon available to content.
 */
const icons = {
  Activity,
  Award,
  BookOpen,
  Bone,
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  Dumbbell,
  Ear,
  Eye,
  Footprints,
  Gauge,
  GraduationCap,
  Hand,
  HandHeart,
  Handshake,
  Heart,
  House,
  Layers,
  Lightbulb,
  MapPin,
  MessageCircle,
  Move,
  PersonStanding,
  Repeat,
  Route,
  ScanSearch,
  SearchCheck,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
} as const;

export type IconName = keyof typeof icons;

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = icons[name];
  return <Cmp aria-hidden strokeWidth={1.8} {...props} />;
}
