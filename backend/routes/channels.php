<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('attendance', function () {
    return true; // Public channel - anyone can listen
});
