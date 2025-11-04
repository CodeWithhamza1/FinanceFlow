'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  type Query,
  type DocumentReference,
  type FirestoreError,
  type CollectionReference,
  Timestamp,
} from 'firebase/firestore';

// Helper function to convert Firestore Timestamps to JS Dates in nested objects
const convertTimestamps = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    if (data !== null && typeof data === 'object') {
        // Handle nested objects
        return Object.keys(data).reduce((acc, key) => {
            acc[key] = convertTimestamps(data[key]);
            return acc;
        }, {} as { [key: string]: any });
    }
    return data;
};


interface FirestoreHook<T> {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
}

export function useCollection<T>(q: Query | CollectionReference | null): FirestoreHook<T[]> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      setData([]);
      return;
    };

    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(q)]);

  return { data, loading, error };
}


export function useDoc<T>(ref: DocumentReference | null): FirestoreHook<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...convertTimestamps(doc.data()) } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ref)]);

  return { data, loading, error };
}