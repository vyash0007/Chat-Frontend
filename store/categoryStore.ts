import { create } from 'zustand';

export type CategoryType = 'all' | 'work' | 'friends' | 'calls' | 'archive';

interface CategoryState {
    activeCategory: CategoryType;
    setActiveCategory: (category: CategoryType) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
    activeCategory: 'all',
    setActiveCategory: (category) => set({ activeCategory: category }),
}));
