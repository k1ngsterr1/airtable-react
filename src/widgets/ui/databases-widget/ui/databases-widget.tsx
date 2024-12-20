"use client";

import { useState } from "react";
import { Plus, Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDatabasesData } from "@/entities/databases/api/use-get-databases";
import { useCreateDatabase } from "@/entities/databases/api/use-create-databases";
import { useNavigate } from "react-router";

export default function DatabasesWidget() {
  const [newDatabaseId, setNewDatabaseId] = useState("");
  const [newDatabaseName, setNewDatabaseName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { data } = useDatabasesData();
  const { mutate: addDatabase, isPending } = useCreateDatabase();

  const handleAddDatabase = () => {
    addDatabase(
      { name: newDatabaseName, databaseID: newDatabaseId },
      {
        onSuccess: () => {
          setNewDatabaseId("");
          setNewDatabaseName("");
          setIsDialogOpen(false);
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex justify-between items-center">
            Ваши базы данных
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить БД
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить новую БД</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="id" className="text-left">
                      ID Базы Данных
                    </Label>
                    <Input
                      id="id"
                      value={newDatabaseId}
                      onChange={(e) => setNewDatabaseId(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name" className="text-left">
                      Имя
                    </Label>
                    <Input
                      id="name"
                      value={newDatabaseName}
                      onChange={(e) => setNewDatabaseName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddDatabase}
                  className="mt-4"
                  disabled={isPending}
                >
                  {isPending ? "Добавляем..." : "Добавить БД"}
                </Button>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {data?.map((db) => (
              <div
                key={db.id}
                className="flex items-center justify-between p-4 mb-2 bg-secondary rounded-lg cursor-pointer transition-colors hover:bg-gray-200"
                onClick={() => navigate(`/${db.id}/filters`)}
              >
                <div className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  <span>{db.name}</span>
                </div>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
