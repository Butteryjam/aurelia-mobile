import React from 'react'

const IconMock: React.FC<any> = ({ size, color, ...props }: any) =>
  React.createElement('span', { 'data-testid': 'lucide-icon', ...props })

export const Compass = IconMock
export const BookOpen = IconMock
export const CalendarDays = IconMock
export const Sparkles = IconMock
export const MoreHorizontal = IconMock
export const FolderArchive = IconMock
export const ShoppingCart = IconMock
export const Heart = IconMock
export const Settings = IconMock
export const Eye = IconMock
export const EyeOff = IconMock
export const ArrowLeft = IconMock
export const AlertCircle = IconMock
export const CheckCircle2 = IconMock
export const Info = IconMock
export const ChevronRight = IconMock
export const ChevronDown = IconMock
export const LogOut = IconMock
export const User = IconMock
export const Construction = IconMock
export const Plus = IconMock
export const Download = IconMock
export const Clock = IconMock
export const ChefHat = IconMock
export const Timer = IconMock
export const Check = IconMock
export const Square = IconMock
export const Users = IconMock
export const Search = IconMock
export const Filter = IconMock
export const SlidersHorizontal = IconMock
export const ArrowUpDown = IconMock
export const X = IconMock
export const Flame = IconMock
export const Share2 = IconMock
export const Calendar = IconMock
export const ArrowRight = IconMock
export const Minus = IconMock
export const Utensils = IconMock
export const Play = IconMock
export const Pencil = IconMock
export const Camera = IconMock
export const Image = IconMock
export const ImageIcon = IconMock
export const Trash2 = IconMock
export const RefreshCw = IconMock
export const ArrowUp = IconMock
export const ArrowDown = IconMock
export const Tag = IconMock
export const FolderPlus = IconMock
export const FolderMinus = IconMock
export const FolderHeart = IconMock
export const Save = IconMock
export const ChevronLeft = IconMock
export const Send = IconMock
export const MessageSquare = IconMock
export const FileText = IconMock
export const Wand2 = IconMock
export const Leaf = IconMock
export const Zap = IconMock
export const Coffee = IconMock
export const Sun = IconMock
export const UtensilsCrossed = IconMock
export const Apple = IconMock
export const Circle = IconMock
export const Activity = IconMock
export const CheckSquare = IconMock
export const ExternalLink = IconMock
export const RotateCcw = IconMock
export const Pause = IconMock
export const Star = IconMock
export const ShoppingBag = IconMock
export const Shield = IconMock
export const Moon = IconMock
export const Smartphone = IconMock

const iconProxy = new Proxy(
  {
    Compass,
    BookOpen,
    CalendarDays,
    Sparkles,
    MoreHorizontal,
    FolderArchive,
    ShoppingCart,
    Heart,
    Settings,
    Eye,
    EyeOff,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    Info,
    ChevronRight,
    ChevronDown,
    LogOut,
    User,
    Construction,
    Plus,
    Download,
    Clock,
    ChefHat,
    Timer,
    Check,
    Square,
    Users,
    Search,
    Filter,
    SlidersHorizontal,
    ArrowUpDown,
    X,
    Flame,
    Share2,
    Calendar,
    ArrowRight,
    Minus,
    Utensils,
    Play,
    Pencil,
    Camera,
    Image,
    ImageIcon,
    Trash2,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    Tag,
    FolderPlus,
    FolderMinus,
    FolderHeart,
    Save,
    ChevronLeft,
    Send,
    MessageSquare,
    FileText,
    Wand2,
    Leaf,
    Zap,
  },
  {
    get: (target: any, prop: string | symbol) => {
      if (prop in target) return target[prop]
      return IconMock
    },
  }
)

export default iconProxy

