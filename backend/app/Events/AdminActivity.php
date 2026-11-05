<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AdminActivity implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $activity,
        public readonly string $message,
        public readonly int|string $recordId,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.activity')];
    }

    public function broadcastAs(): string
    {
        return 'admin.activity';
    }

    public function broadcastWith(): array
    {
        return [
            'activity' => $this->activity,
            'message' => $this->message,
            'recordId' => $this->recordId,
            'createdAt' => now()->toIso8601String(),
        ];
    }
}
