"use client";

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { getIcon } from '../icons';
import { iconList } from '../../lib/data';
import { cn } from '../../lib/utils';
import type { Category } from '../../lib/types';


interface AddCategoryDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (name: string, icon: string) => void;
    categoryToEdit?: Category | null;
}

export default function AddCategoryDialog({ isOpen, onOpenChange, onConfirm, categoryToEdit }: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(iconList[0]);
  const [error, setError] = useState('');
  const isEditMode = !!categoryToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setName(categoryToEdit.name);
        setSelectedIcon(categoryToEdit.icon);
      } else {
        setName('');
        setSelectedIcon(iconList[0]);
        setError('');
      }
    }
  }, [isOpen, isEditMode, categoryToEdit]);

  const handleSubmit = () => {
    if (!name.trim()) {
        setError("Category name is required.");
        return;
    }
    setError('');
    onConfirm(name, selectedIcon);
  }
  
  const handleClose = (open: boolean) => {
    if (!open) {
      setError('');
      setName('');
      setSelectedIcon(iconList[0]);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the name and icon for your category.' : 'Choose a name and an icon for your new category.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input 
                    id="category-name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Groceries"
                />
                {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <div className="space-y-2">
                <Label>Icon</Label>
                <ScrollArea className="h-40 rounded-md border p-4">
                    <div className="grid grid-cols-6 gap-2">
                        {iconList.map(iconName => {
                            const Icon = getIcon(iconName);
                            return (
                                <Button
                                    key={iconName}
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSelectedIcon(iconName)}
                                    className={cn(
                                        "h-12 w-12",
                                        selectedIcon === iconName && "ring-2 ring-primary"
                                    )}
                                >
                                    <Icon className="h-6 w-6" />
                                </Button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{isEditMode ? 'Save Changes' : 'Add Category'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
