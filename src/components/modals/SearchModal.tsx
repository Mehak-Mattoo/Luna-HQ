"use client";
import React, { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  Dialog,
  DialogDescription,
} from "../ui/dialog";
import { useSearchNotes } from "@/hooks/useNotes";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { highlightText } from "../helpers/HighlightText";
import { getSnippet } from "../helpers/constants";
import { useRouter } from "next/navigation";
import { notePath, protectedRoutes } from "../helpers/routes";

type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const {
    data: searchResults = [],
    isLoading,
    isError,
    error,
  } = useSearchNotes(query);
  const router = useRouter();

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) setQuery("");
        }}
      >
        <DialogContent showCloseButton={false}>
          <Input
            autoFocus
            placeholder="Type at least 2 characters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0"
          />

          {isLoading && <p className=" text-muted-foreground">Searching…</p>}
          {isError && <p className=" text-destructive">{error?.message}</p>}

          {query.trim().length >= 2 &&
            !isLoading &&
            searchResults.length === 0 && (
              <p className=" text-muted-foreground">No notes found</p>
            )}
          {searchResults.map((result) => (
            <div
              key={result.id}
              onClick={() => {
                router.push(notePath(result));
                onOpenChange(false);
              }}
              className="cursor-pointer"
            >
              <p key={result.id}>{highlightText(result.title, query)}</p>
              <h6 className="text-muted-foreground" key={result.id}>
                {highlightText(getSnippet(result.content, query), query)}
              </h6>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
};
export default SearchModal;
