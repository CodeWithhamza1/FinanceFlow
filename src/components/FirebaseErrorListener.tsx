'use client';

import { useEffect } from 'react';
import { errorEmitter } from '../firebase/error-emitter';
import { FirestorePermissionError } from '../firebase/errors';
import { useToast } from '../hooks/use-toast';

// This is a client-side component that should be mounted at the root of your app.
// It listens for custom permission errors and throws them to trigger Next.js's error overlay.
export default function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error('A Firestore permission error was caught:', error.message);
      
      // Throw the error to make it visible in the Next.js development error overlay.
      // This provides a much better debugging experience than just logging to the console.
      if (process.env.NODE_ENV === 'development') {
         throw error;
      } else {
        // In production, just show a generic toast message.
         toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to perform this action.",
         });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component doesn't render anything itself.
}
