"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getIcon } from '../icons';
import type { Category } from '../../lib/types';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import AddCategoryDialog from './add-category-dialog';
import api from '@/lib/api';
import { useToast } from '../../hooks/use-toast';
import { useCategories } from '../../hooks/use-categories';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface ManageCategoriesCardProps {
  categories: Category[];
}

export default function ManageCategoriesCard({ categories: initialCategories }: ManageCategoriesCardProps) {
  const { toast } = useToast();
  const { data: categories, refetch } = useCategories();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  const displayCategories = categories || initialCategories || [];

  const handleOpenDialog = (category?: Category) => {
    setCategoryToEdit(category || null);
    setDialogOpen(true);
  }
  
  const handleCloseDialog = () => {
    setCategoryToEdit(null);
    setDialogOpen(false);
  }

  const handleAddOrUpdateCategory = async (name: string, icon: string) => {
    try {
      if (categoryToEdit) {
        // Update existing category
        await api.put(`/api/categories/${categoryToEdit.id}`, { name, icon });
        toast({ title: "Success", description: "Category updated successfully." });
      } else {
        // Add new category
        await api.post('/api/categories', { name, icon });
        toast({ title: "Success", description: "Category added successfully." });
      }
      refetch();
      handleCloseDialog();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save category',
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await api.delete(`/api/categories/${categoryToDelete.id}`);
      toast({ title: "Success", description: "Category deleted successfully." });
      refetch();
      setCategoryToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete category',
      });
    }
  };

  return (
    <>
      <Card id="categories">
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>
            Add, edit, or delete your custom spending categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-2">
                {displayCategories.map((category) => {
                    const Icon = getIcon(category.icon);
                    return (
                        <div key={category.id} className="group relative">
                          <Badge variant="outline" className="flex items-center gap-2 py-2 px-3 pr-4">
                              <Icon className="h-4 w-4" />
                              <span>{category.name}</span>
                          </Badge>
                          <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(category)}>
                                  <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setCategoryToDelete(category)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>
                    );
                })}
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Category
          </Button>
        </CardFooter>
      </Card>
      
      <AddCategoryDialog
        isOpen={isDialogOpen}
        onOpenChange={handleCloseDialog}
        onConfirm={handleAddOrUpdateCategory}
        categoryToEdit={categoryToEdit}
      />

       <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category: <span className="font-semibold">"{categoryToDelete?.name}"</span>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
