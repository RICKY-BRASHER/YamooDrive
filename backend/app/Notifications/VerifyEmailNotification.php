<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Vérifiez votre adresse e-mail')
            ->greeting('Bonjour,')
            ->line('Merci d’avoir créé un compte Yamoo Drive.')
            ->line('Veuillez confirmer votre adresse e-mail pour pouvoir vous connecter.')
            ->action('Vérifier mon adresse e-mail', $url)
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.');
    }
}
