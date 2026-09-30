import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/nakano/game-app";

export const Route = createFileRoute("/")({ component: GameApp });
