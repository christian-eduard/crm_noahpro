import { vi } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    FileText: () => <div>FileText Icon</div>,
    Eye: () => <div>Eye Icon</div>,
    Mail: () => <div>Mail Icon</div>,
    Calendar: () => <div>Calendar Icon</div>,
    Filter: () => <div>Filter Icon</div>,
    Download: () => <div>Download Icon</div>,
    Search: () => <div>Search Icon</div>,
    Plus: () => <div>Plus Icon</div>,
    Edit: () => <div>Edit Icon</div>,
    Trash2: () => <div>Trash2 Icon</div>,
    Copy: () => <div>Copy Icon</div>,
    ChevronLeft: () => <div>ChevronLeft Icon</div>,
    ChevronRight: () => <div>ChevronRight Icon</div>,
    List: () => <div>List Icon</div>,
    LayoutGrid: () => <div>LayoutGrid Icon</div>,
    Settings: () => <div>Settings Icon</div>,
    Bell: () => <div>Bell Icon</div>,
    User: () => <div>User Icon</div>,
    Shield: () => <div>Shield Icon</div>,
    Power: () => <div>Power Icon</div>,
    Clock: () => <div>Clock Icon</div>,
    TestTube: () => <div>TestTube Icon</div>,
    Save: () => <div>Save Icon</div>,
    GripVertical: () => <div>GripVertical Icon</div>
}));
