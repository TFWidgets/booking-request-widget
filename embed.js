/*!
 * TF Widgets — Booking Request v1
 * Встраивание: <script src=".../embed.js" data-id="CLIENT_ID"></script>
 * Конфиг клиента: configs/CLIENT_ID.json (почты владельца в нём НЕТ — она хранится только на сервере)
 * Это форма ЗАПРОСА брони: гость оставляет заявку, владелец подтверждает сам. Реальной занятости виджет не знает.
 * Два режима: форма (заявка уходит на сервер TF Widgets → письмом владельцу) или кнопка-ссылка на внешнюю систему записи.
 * Вид: блок на странице или плавающая кнопка с окном. Все стили ограничены классом .tfw-bk.
 */
(function () {
    'use strict';
    var VERSION = '1.0.0';
    var LOG = '[TFW Booking]';
    var API = 'https://forms.tf-widgets.com';         // куда отправляются заявки (воркер tfw-orders)
    var PREVIEW_DOMAINS = ['tf-widgets.com', '*.tf-widgets.com', '9ac5za-h1.myshopify.com'];
    var CONTACT = ['name', 'phone', 'email'];
    // какие поля у какого типа бизнеса (порядок = порядок в форме)
    var PRESET_FIELDS = {
        services:   ['service', 'staff', 'date', 'time', 'name', 'phone', 'email', 'comment'],
        trades:     ['job', 'address', 'date', 'window', 'details', 'name', 'phone', 'email'],
        restaurant: ['date', 'time', 'guests', 'occasion', 'name', 'phone', 'email', 'comment'],
        rental:     ['item', 'start', 'end', 'name', 'phone', 'email', 'comment']
    };
    var ALL_FIELDS = ['service', 'staff', 'job', 'item', 'address', 'date', 'time', 'window', 'start', 'end', 'guests', 'occasion', 'details', 'name', 'phone', 'email', 'comment'];
    var PLATFORMS = { fresha: 'Fresha', booksy: 'Booksy', thefork: 'TheFork', opentable: 'OpenTable', easyweek: 'EasyWeek', calendly: 'Calendly', other: '' };

    // Тексты интерфейса на языках клиентов. Пустое поле в настройках = текст отсюда.
    var I18N = {
        en: {
            service: 'Service', staff: 'Specialist', anyStaff: 'No preference', job: 'Type of work', address: 'Address',
            date: 'Preferred date', time: 'Preferred time', window: 'Preferred time of day', guests: 'Guests', occasion: 'Occasion',
            item: 'What would you like to book?', start: 'From', end: 'Until', name: 'Name', phone: 'Phone', email: 'Email',
            comment: 'Comment', details: 'Describe the job',
            morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', anyTime: 'Any time',
            pickDate: 'Select a date', pickTime: 'Select a time', select: 'Select…', noTimes: 'No times left on this day',
            guest1: 'guest', guestN: 'guests', min: 'min', prev: 'Previous month', next: 'Next month', close: 'Close',
            required: 'Please fill in this field', badEmail: 'Please enter a valid email', badPhone: 'Please enter a valid phone number',
            contactOne: 'Please leave a phone number or an email', endBefore: 'The end must be after the start',
            consentMiss: 'Please confirm the checkbox above.', rate: 'Too many requests. Please try again in a few minutes.',
            fail: 'Sorry, the request could not be sent. Please try again later.', network: 'Network error. Please check your connection and try again.',
            check: 'Please check the fields and try again.', submit: 'Send request', successTitle: 'Request sent',
            successText: 'Thank you! This is a request, not a confirmed booking yet. We will get back to you shortly to confirm.',
            consent: 'I agree that my details are sent to the business to handle this request.', privacy: 'Privacy policy',
            launcher: 'Book now', linkBtn: 'Book online', linkOn: 'Book on {p}',
            t_services: 'Book an appointment', s_services: 'Choose a service and a time that suits you. We will confirm your appointment shortly.',
            t_trades: 'Request a visit', s_trades: 'Tell us what needs doing and when suits you. We will get back to you to confirm.',
            t_restaurant: 'Book a table', s_restaurant: 'Pick a date, a time and the number of guests. We will confirm your table shortly.',
            t_rental: 'Request a booking', s_rental: 'Choose what you would like to book and for when. We will confirm availability shortly.'
        },
        es: {
            service: 'Servicio', staff: 'Profesional', anyStaff: 'Sin preferencia', job: 'Tipo de trabajo', address: 'Dirección',
            date: 'Fecha preferida', time: 'Hora preferida', window: 'Franja preferida', guests: 'Personas', occasion: 'Ocasión',
            item: '¿Qué quieres reservar?', start: 'Desde', end: 'Hasta', name: 'Nombre', phone: 'Teléfono', email: 'Email',
            comment: 'Comentario', details: 'Describe el trabajo',
            morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche', anyTime: 'Cualquier hora',
            pickDate: 'Elige una fecha', pickTime: 'Elige una hora', select: 'Elige…', noTimes: 'No quedan horas este día',
            guest1: 'persona', guestN: 'personas', min: 'min', prev: 'Mes anterior', next: 'Mes siguiente', close: 'Cerrar',
            required: 'Rellena este campo', badEmail: 'Introduce un email válido', badPhone: 'Introduce un teléfono válido',
            contactOne: 'Deja un teléfono o un email', endBefore: 'El final debe ser posterior al inicio',
            consentMiss: 'Marca la casilla de arriba.', rate: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.',
            fail: 'No se pudo enviar la solicitud. Inténtalo más tarde.', network: 'Error de conexión. Revisa tu conexión e inténtalo de nuevo.',
            check: 'Revisa los campos e inténtalo de nuevo.', submit: 'Enviar solicitud', successTitle: 'Solicitud enviada',
            successText: '¡Gracias! Es una solicitud, aún no una reserva confirmada. Te contactaremos pronto para confirmarla.',
            consent: 'Acepto que mis datos se envíen al negocio para gestionar esta solicitud.', privacy: 'Política de privacidad',
            launcher: 'Reservar', linkBtn: 'Reservar online', linkOn: 'Reservar en {p}',
            t_services: 'Pide tu cita', s_services: 'Elige un servicio y la hora que te venga bien. Te confirmaremos la cita en breve.',
            t_trades: 'Solicita una visita', s_trades: 'Cuéntanos qué necesitas y cuándo te viene bien. Te contactaremos para confirmar.',
            t_restaurant: 'Reserva una mesa', s_restaurant: 'Elige fecha, hora y número de personas. Te confirmaremos la mesa en breve.',
            t_rental: 'Solicita una reserva', s_rental: 'Elige qué quieres reservar y para cuándo. Te confirmaremos la disponibilidad en breve.'
        },
        fr: {
            service: 'Prestation', staff: 'Professionnel', anyStaff: 'Pas de préférence', job: 'Type de travaux', address: 'Adresse',
            date: 'Date souhaitée', time: 'Heure souhaitée', window: 'Moment souhaité', guests: 'Personnes', occasion: 'Occasion',
            item: 'Que souhaitez-vous réserver ?', start: 'Du', end: 'Au', name: 'Nom', phone: 'Téléphone', email: 'E-mail',
            comment: 'Commentaire', details: 'Décrivez les travaux',
            morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir', anyTime: 'Peu importe',
            pickDate: 'Choisissez une date', pickTime: 'Choisissez une heure', select: 'Choisir…', noTimes: 'Plus de créneaux ce jour-là',
            guest1: 'personne', guestN: 'personnes', min: 'min', prev: 'Mois précédent', next: 'Mois suivant', close: 'Fermer',
            required: 'Veuillez remplir ce champ', badEmail: 'Veuillez saisir un e-mail valide', badPhone: 'Veuillez saisir un numéro valide',
            contactOne: 'Laissez un téléphone ou un e-mail', endBefore: 'La fin doit être après le début',
            consentMiss: 'Veuillez cocher la case ci-dessus.', rate: 'Trop de demandes. Réessayez dans quelques minutes.',
            fail: 'La demande n’a pas pu être envoyée. Réessayez plus tard.', network: 'Erreur réseau. Vérifiez votre connexion et réessayez.',
            check: 'Vérifiez les champs et réessayez.', submit: 'Envoyer la demande', successTitle: 'Demande envoyée',
            successText: 'Merci ! Il s’agit d’une demande, pas encore d’une réservation confirmée. Nous revenons vers vous rapidement pour confirmer.',
            consent: 'J’accepte que mes coordonnées soient transmises à l’établissement pour traiter cette demande.', privacy: 'Politique de confidentialité',
            launcher: 'Réserver', linkBtn: 'Réserver en ligne', linkOn: 'Réserver sur {p}',
            t_services: 'Prendre rendez-vous', s_services: 'Choisissez une prestation et un horaire. Nous confirmons votre rendez-vous rapidement.',
            t_trades: 'Demander une intervention', s_trades: 'Dites-nous ce qu’il faut faire et quand cela vous convient. Nous vous recontactons pour confirmer.',
            t_restaurant: 'Réserver une table', s_restaurant: 'Choisissez la date, l’heure et le nombre de personnes. Nous confirmons votre table rapidement.',
            t_rental: 'Demander une réservation', s_rental: 'Choisissez ce que vous souhaitez réserver et pour quand. Nous confirmons la disponibilité rapidement.'
        },
        it: {
            service: 'Servizio', staff: 'Operatore', anyStaff: 'Nessuna preferenza', job: 'Tipo di lavoro', address: 'Indirizzo',
            date: 'Data preferita', time: 'Orario preferito', window: 'Fascia preferita', guests: 'Persone', occasion: 'Occasione',
            item: 'Cosa vuoi prenotare?', start: 'Dal', end: 'Al', name: 'Nome', phone: 'Telefono', email: 'Email',
            comment: 'Commento', details: 'Descrivi il lavoro',
            morning: 'Mattina', afternoon: 'Pomeriggio', evening: 'Sera', anyTime: 'Qualsiasi orario',
            pickDate: 'Scegli una data', pickTime: 'Scegli un orario', select: 'Scegli…', noTimes: 'Nessun orario disponibile in questo giorno',
            guest1: 'persona', guestN: 'persone', min: 'min', prev: 'Mese precedente', next: 'Mese successivo', close: 'Chiudi',
            required: 'Compila questo campo', badEmail: 'Inserisci un’email valida', badPhone: 'Inserisci un numero valido',
            contactOne: 'Lascia un telefono o un’email', endBefore: 'La fine deve essere dopo l’inizio',
            consentMiss: 'Spunta la casella qui sopra.', rate: 'Troppe richieste. Riprova tra qualche minuto.',
            fail: 'Impossibile inviare la richiesta. Riprova più tardi.', network: 'Errore di rete. Controlla la connessione e riprova.',
            check: 'Controlla i campi e riprova.', submit: 'Invia richiesta', successTitle: 'Richiesta inviata',
            successText: 'Grazie! Questa è una richiesta, non ancora una prenotazione confermata. Ti ricontatteremo a breve per confermare.',
            consent: 'Accetto che i miei dati vengano inviati all’attività per gestire questa richiesta.', privacy: 'Privacy policy',
            launcher: 'Prenota', linkBtn: 'Prenota online', linkOn: 'Prenota su {p}',
            t_services: 'Prenota un appuntamento', s_services: 'Scegli un servizio e l’orario che preferisci. Ti confermeremo l’appuntamento a breve.',
            t_trades: 'Richiedi un intervento', s_trades: 'Dicci cosa serve e quando ti è comodo. Ti ricontatteremo per confermare.',
            t_restaurant: 'Prenota un tavolo', s_restaurant: 'Scegli data, orario e numero di persone. Ti confermeremo il tavolo a breve.',
            t_rental: 'Richiedi una prenotazione', s_rental: 'Scegli cosa prenotare e per quando. Ti confermeremo la disponibilità a breve.'
        },
        nl: {
            service: 'Behandeling', staff: 'Medewerker', anyStaff: 'Geen voorkeur', job: 'Soort werk', address: 'Adres',
            date: 'Gewenste datum', time: 'Gewenste tijd', window: 'Gewenst dagdeel', guests: 'Personen', occasion: 'Gelegenheid',
            item: 'Wat wil je boeken?', start: 'Van', end: 'Tot', name: 'Naam', phone: 'Telefoon', email: 'E-mail',
            comment: 'Opmerking', details: 'Beschrijf het werk',
            morning: 'Ochtend', afternoon: 'Middag', evening: 'Avond', anyTime: 'Maakt niet uit',
            pickDate: 'Kies een datum', pickTime: 'Kies een tijd', select: 'Kies…', noTimes: 'Geen tijden meer op deze dag',
            guest1: 'persoon', guestN: 'personen', min: 'min', prev: 'Vorige maand', next: 'Volgende maand', close: 'Sluiten',
            required: 'Vul dit veld in', badEmail: 'Vul een geldig e-mailadres in', badPhone: 'Vul een geldig telefoonnummer in',
            contactOne: 'Laat een telefoonnummer of e-mailadres achter', endBefore: 'Het einde moet na het begin liggen',
            consentMiss: 'Vink het vakje hierboven aan.', rate: 'Te veel aanvragen. Probeer het over een paar minuten opnieuw.',
            fail: 'De aanvraag kon niet worden verstuurd. Probeer het later opnieuw.', network: 'Netwerkfout. Controleer je verbinding en probeer het opnieuw.',
            check: 'Controleer de velden en probeer het opnieuw.', submit: 'Aanvraag versturen', successTitle: 'Aanvraag verstuurd',
            successText: 'Bedankt! Dit is een aanvraag, nog geen bevestigde boeking. We nemen snel contact met je op om te bevestigen.',
            consent: 'Ik ga ermee akkoord dat mijn gegevens naar het bedrijf worden gestuurd om deze aanvraag af te handelen.', privacy: 'Privacybeleid',
            launcher: 'Boek nu', linkBtn: 'Online boeken', linkOn: 'Boek via {p}',
            t_services: 'Maak een afspraak', s_services: 'Kies een behandeling en een tijd die je uitkomt. We bevestigen je afspraak snel.',
            t_trades: 'Vraag een bezoek aan', s_trades: 'Vertel ons wat er moet gebeuren en wanneer het je uitkomt. We nemen contact op om te bevestigen.',
            t_restaurant: 'Reserveer een tafel', s_restaurant: 'Kies een datum, tijd en het aantal personen. We bevestigen je tafel snel.',
            t_rental: 'Vraag een boeking aan', s_rental: 'Kies wat je wilt boeken en voor wanneer. We bevestigen de beschikbaarheid snel.'
        },
        pt: {
            service: 'Serviço', staff: 'Profissional', anyStaff: 'Sem preferência', job: 'Tipo de trabalho', address: 'Morada',
            date: 'Data preferida', time: 'Hora preferida', window: 'Período preferido', guests: 'Pessoas', occasion: 'Ocasião',
            item: 'O que deseja reservar?', start: 'De', end: 'Até', name: 'Nome', phone: 'Telefone', email: 'Email',
            comment: 'Comentário', details: 'Descreva o trabalho',
            morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite', anyTime: 'Qualquer hora',
            pickDate: 'Escolha uma data', pickTime: 'Escolha uma hora', select: 'Escolher…', noTimes: 'Sem horários neste dia',
            guest1: 'pessoa', guestN: 'pessoas', min: 'min', prev: 'Mês anterior', next: 'Mês seguinte', close: 'Fechar',
            required: 'Preencha este campo', badEmail: 'Introduza um email válido', badPhone: 'Introduza um telefone válido',
            contactOne: 'Deixe um telefone ou um email', endBefore: 'O fim tem de ser depois do início',
            consentMiss: 'Assinale a caixa acima.', rate: 'Demasiados pedidos. Tente novamente dentro de alguns minutos.',
            fail: 'Não foi possível enviar o pedido. Tente mais tarde.', network: 'Erro de rede. Verifique a ligação e tente novamente.',
            check: 'Verifique os campos e tente novamente.', submit: 'Enviar pedido', successTitle: 'Pedido enviado',
            successText: 'Obrigado! Isto é um pedido, ainda não uma reserva confirmada. Entraremos em contacto em breve para confirmar.',
            consent: 'Aceito que os meus dados sejam enviados ao estabelecimento para tratar este pedido.', privacy: 'Política de privacidade',
            launcher: 'Reservar', linkBtn: 'Reservar online', linkOn: 'Reservar no {p}',
            t_services: 'Marque uma consulta', s_services: 'Escolha um serviço e a hora que lhe dá jeito. Confirmamos a marcação em breve.',
            t_trades: 'Peça uma visita', s_trades: 'Diga-nos o que precisa e quando lhe dá jeito. Entraremos em contacto para confirmar.',
            t_restaurant: 'Reserve uma mesa', s_restaurant: 'Escolha a data, a hora e o número de pessoas. Confirmamos a sua mesa em breve.',
            t_rental: 'Peça uma reserva', s_rental: 'Escolha o que deseja reservar e para quando. Confirmamos a disponibilidade em breve.'
        },
        de: {
            service: 'Leistung', staff: 'Mitarbeiter/in', anyStaff: 'Egal', job: 'Art der Arbeit', address: 'Adresse',
            date: 'Wunschdatum', time: 'Wunschzeit', window: 'Gewünschte Tageszeit', guests: 'Personen', occasion: 'Anlass',
            item: 'Was möchten Sie buchen?', start: 'Von', end: 'Bis', name: 'Name', phone: 'Telefon', email: 'E-Mail',
            comment: 'Kommentar', details: 'Beschreiben Sie die Arbeit',
            morning: 'Vormittag', afternoon: 'Nachmittag', evening: 'Abend', anyTime: 'Egal wann',
            pickDate: 'Datum wählen', pickTime: 'Uhrzeit wählen', select: 'Auswählen…', noTimes: 'An diesem Tag keine Zeiten mehr frei',
            guest1: 'Person', guestN: 'Personen', min: 'Min.', prev: 'Vorheriger Monat', next: 'Nächster Monat', close: 'Schließen',
            required: 'Bitte füllen Sie dieses Feld aus', badEmail: 'Bitte geben Sie eine gültige E-Mail ein', badPhone: 'Bitte geben Sie eine gültige Telefonnummer ein',
            contactOne: 'Bitte hinterlassen Sie eine Telefonnummer oder E-Mail', endBefore: 'Das Ende muss nach dem Beginn liegen',
            consentMiss: 'Bitte bestätigen Sie das Kästchen oben.', rate: 'Zu viele Anfragen. Bitte versuchen Sie es in ein paar Minuten erneut.',
            fail: 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.', network: 'Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung.',
            check: 'Bitte prüfen Sie die Felder und versuchen Sie es erneut.', submit: 'Anfrage senden', successTitle: 'Anfrage gesendet',
            successText: 'Vielen Dank! Dies ist eine Anfrage, noch keine bestätigte Buchung. Wir melden uns in Kürze zur Bestätigung.',
            consent: 'Ich bin einverstanden, dass meine Angaben zur Bearbeitung dieser Anfrage an das Unternehmen gesendet werden.', privacy: 'Datenschutz',
            launcher: 'Jetzt buchen', linkBtn: 'Online buchen', linkOn: 'Auf {p} buchen',
            t_services: 'Termin anfragen', s_services: 'Wählen Sie eine Leistung und eine passende Zeit. Wir bestätigen Ihren Termin in Kürze.',
            t_trades: 'Besuch anfragen', s_trades: 'Sagen Sie uns, was zu tun ist und wann es Ihnen passt. Wir melden uns zur Bestätigung.',
            t_restaurant: 'Tisch reservieren', s_restaurant: 'Wählen Sie Datum, Uhrzeit und Personenzahl. Wir bestätigen Ihren Tisch in Kürze.',
            t_rental: 'Buchung anfragen', s_rental: 'Wählen Sie, was Sie buchen möchten und wann. Wir bestätigen die Verfügbarkeit in Kürze.'
        },
        pl: {
            service: 'Usługa', staff: 'Specjalista', anyStaff: 'Bez znaczenia', job: 'Rodzaj prac', address: 'Adres',
            date: 'Preferowana data', time: 'Preferowana godzina', window: 'Preferowana pora dnia', guests: 'Liczba osób', occasion: 'Okazja',
            item: 'Co chcesz zarezerwować?', start: 'Od', end: 'Do', name: 'Imię', phone: 'Telefon', email: 'E-mail',
            comment: 'Komentarz', details: 'Opisz prace',
            morning: 'Rano', afternoon: 'Po południu', evening: 'Wieczorem', anyTime: 'Obojętnie',
            pickDate: 'Wybierz datę', pickTime: 'Wybierz godzinę', select: 'Wybierz…', noTimes: 'Brak wolnych godzin tego dnia',
            guest1: 'osoba', guestN: 'osoby', min: 'min', prev: 'Poprzedni miesiąc', next: 'Następny miesiąc', close: 'Zamknij',
            required: 'Wypełnij to pole', badEmail: 'Podaj poprawny e-mail', badPhone: 'Podaj poprawny numer telefonu',
            contactOne: 'Zostaw telefon lub e-mail', endBefore: 'Koniec musi być po początku',
            consentMiss: 'Zaznacz pole powyżej.', rate: 'Zbyt wiele zgłoszeń. Spróbuj ponownie za kilka minut.',
            fail: 'Nie udało się wysłać zgłoszenia. Spróbuj później.', network: 'Błąd sieci. Sprawdź połączenie i spróbuj ponownie.',
            check: 'Sprawdź pola i spróbuj ponownie.', submit: 'Wyślij zgłoszenie', successTitle: 'Zgłoszenie wysłane',
            successText: 'Dziękujemy! To jest zgłoszenie, a nie potwierdzona rezerwacja. Wkrótce się odezwiemy, aby ją potwierdzić.',
            consent: 'Zgadzam się na przekazanie moich danych firmie w celu obsługi tego zgłoszenia.', privacy: 'Polityka prywatności',
            launcher: 'Zarezerwuj', linkBtn: 'Rezerwuj online', linkOn: 'Rezerwuj w {p}',
            t_services: 'Umów wizytę', s_services: 'Wybierz usługę i dogodny termin. Wkrótce potwierdzimy wizytę.',
            t_trades: 'Zamów wizytę fachowca', s_trades: 'Napisz, co trzeba zrobić i kiedy ci pasuje. Odezwiemy się, aby potwierdzić.',
            t_restaurant: 'Zarezerwuj stolik', s_restaurant: 'Wybierz datę, godzinę i liczbę osób. Wkrótce potwierdzimy stolik.',
            t_rental: 'Wyślij zapytanie o rezerwację', s_rental: 'Wybierz, co chcesz zarezerwować i na kiedy. Wkrótce potwierdzimy dostępność.'
        },
        cs: {
            service: 'Služba', staff: 'Specialista', anyStaff: 'Je mi to jedno', job: 'Druh práce', address: 'Adresa',
            date: 'Preferované datum', time: 'Preferovaný čas', window: 'Preferovaná část dne', guests: 'Počet osob', occasion: 'Příležitost',
            item: 'Co chcete rezervovat?', start: 'Od', end: 'Do', name: 'Jméno', phone: 'Telefon', email: 'E-mail',
            comment: 'Poznámka', details: 'Popište práci',
            morning: 'Dopoledne', afternoon: 'Odpoledne', evening: 'Večer', anyTime: 'Kdykoli',
            pickDate: 'Vyberte datum', pickTime: 'Vyberte čas', select: 'Vyberte…', noTimes: 'Na tento den už nejsou volné časy',
            guest1: 'osoba', guestN: 'osob', min: 'min', prev: 'Předchozí měsíc', next: 'Další měsíc', close: 'Zavřít',
            required: 'Vyplňte toto pole', badEmail: 'Zadejte platný e-mail', badPhone: 'Zadejte platné telefonní číslo',
            contactOne: 'Zanechte telefon nebo e-mail', endBefore: 'Konec musí být po začátku',
            consentMiss: 'Zaškrtněte políčko výše.', rate: 'Příliš mnoho žádostí. Zkuste to znovu za pár minut.',
            fail: 'Žádost se nepodařilo odeslat. Zkuste to později.', network: 'Chyba sítě. Zkontrolujte připojení a zkuste to znovu.',
            check: 'Zkontrolujte pole a zkuste to znovu.', submit: 'Odeslat žádost', successTitle: 'Žádost odeslána',
            successText: 'Děkujeme! Jde o žádost, zatím ne o potvrzenou rezervaci. Brzy se vám ozveme a rezervaci potvrdíme.',
            consent: 'Souhlasím s předáním mých údajů provozovateli za účelem vyřízení této žádosti.', privacy: 'Zásady ochrany osobních údajů',
            launcher: 'Rezervovat', linkBtn: 'Rezervovat online', linkOn: 'Rezervovat na {p}',
            t_services: 'Objednejte se', s_services: 'Vyberte službu a čas, který vám vyhovuje. Termín vám brzy potvrdíme.',
            t_trades: 'Objednejte návštěvu', s_trades: 'Napište nám, co je potřeba udělat a kdy se vám to hodí. Ozveme se a termín potvrdíme.',
            t_restaurant: 'Rezervujte si stůl', s_restaurant: 'Vyberte datum, čas a počet osob. Stůl vám brzy potvrdíme.',
            t_rental: 'Pošlete žádost o rezervaci', s_rental: 'Vyberte, co chcete rezervovat a na kdy. Dostupnost vám brzy potvrdíme.'
        }
    };

    var ICONS = {
        cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3V2zm12 8H5v9h14v-9zM5 8h14V6H5v2zm2 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/></svg>',
        clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 3v4.6l3.2 3.2-1.4 1.4L11 12.4V7h2z"/></svg>',
        close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
        check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.2 5.2 11.8 6.6l4.4 4.4H4v2h12.2l-4.4 4.4 1.4 1.4L20 12z"/></svg>',
        ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3zM5 5h6v2H6v11h11v-5h2v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>',
        left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/></svg>',
        right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 18.6 10 20l8-8-8-8-1.4 1.4 6.6 6.6z"/></svg>'
    };

    var inlineCSS = `
        .tfw-bk, .tfw-bk * { box-sizing: border-box; }
        .tfw-bk { font-family: var(--bk-font); -webkit-font-smoothing: antialiased; color: var(--bk-text); line-height: 1.45; text-align: left; }
        .tfw-bk-card { position: relative; width: 100%; max-width: var(--bk-w); margin: 0 auto; padding: var(--bk-pad); background: var(--bk-bg); color: var(--bk-text);
            border: 1px solid var(--bk-border); border-radius: var(--bk-r); box-shadow: var(--bk-shadow); }
        .tfw-bk-title { margin: 0 0 6px; font: 700 calc(var(--bk-fs) * 1.45)/1.2 var(--bk-font); color: var(--bk-text); letter-spacing: -.01em; }
        .tfw-bk-sub { margin: 0 0 18px; font-size: var(--bk-fs); color: var(--bk-muted); }
        .tfw-bk-form { display: grid; gap: 12px; margin: 0; }
        .tfw-bk-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tfw-bk-f { position: relative; display: grid; gap: 6px; min-width: 0; margin: 0; }
        .tfw-bk-f > span { font-size: calc(var(--bk-fs) * .86); font-weight: 600; color: var(--bk-text); }
        .tfw-bk-f > span i { font-style: normal; color: var(--bk-accent); margin-left: 2px; }
        .tfw-bk input, .tfw-bk textarea, .tfw-bk select, .tfw-bk-pick {
            width: 100%; margin: 0; padding: .72em .85em; min-height: 0; font: 400 var(--bk-fs)/1.4 var(--bk-font); color: var(--bk-text);
            background: var(--bk-field); border: 1px solid var(--bk-border); border-radius: calc(var(--bk-r) * .55); outline: none; box-shadow: none;
            -webkit-appearance: none; appearance: none; transition: border-color .15s, box-shadow .15s; }
        .tfw-bk textarea { min-height: 6em; resize: vertical; }
        .tfw-bk select { background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
            background-position: calc(100% - 18px) 55%, calc(100% - 13px) 55%; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 2.2em; text-overflow: ellipsis; }
        .tfw-bk select:invalid, .tfw-bk select.tfw-bk-empty, .tfw-bk-pick.tfw-bk-empty { color: var(--bk-muted); }
        .tfw-bk select option { color: #111; }
        .tfw-bk input::placeholder, .tfw-bk textarea::placeholder { color: var(--bk-muted); opacity: .8; }
        .tfw-bk input:focus, .tfw-bk textarea:focus, .tfw-bk select:focus, .tfw-bk-pick:focus-visible, .tfw-bk-pick[aria-expanded="true"] { border-color: var(--bk-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--bk-accent) 22%, transparent); }
        .tfw-bk-pick { display: flex; align-items: center; gap: .55em; text-align: left; cursor: pointer; }
        .tfw-bk-pick svg { flex: none; width: 1.1em; height: 1.1em; color: var(--bk-muted); }
        .tfw-bk-pick b { flex: 1; min-width: 0; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tfw-bk-f.tfw-bk-bad :is(input, textarea, select, .tfw-bk-pick) { border-color: #ef4444; }
        .tfw-bk-err { display: none; font-size: calc(var(--bk-fs) * .8); color: #ef4444; font-style: normal; }
        .tfw-bk-f.tfw-bk-bad .tfw-bk-err { display: block; }
        .tfw-bk-hintline { font-size: calc(var(--bk-fs) * .78); color: var(--bk-muted); font-style: normal; }

        .tfw-bk-cal { position: absolute; left: 0; top: calc(100% + 6px); z-index: 30; width: 296px; max-width: calc(100vw - 32px); padding: 12px; background: var(--bk-bg); color: var(--bk-text);
            border: 1px solid var(--bk-border); border-radius: calc(var(--bk-r) * .7 + 4px); box-shadow: 0 18px 40px -12px rgba(0,0,0,.35); }
        .tfw-bk-cal[hidden] { display: none; }
        .tfw-bk-cal-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-weight: 700; font-size: var(--bk-fs); text-transform: capitalize; }
        .tfw-bk-cal-h button, .tfw-bk-days button { margin: 0; padding: 0; min-height: 0; border: 0; background: none; box-shadow: none; color: inherit; font: inherit; cursor: pointer; }
        .tfw-bk-cal-h button { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; }
        .tfw-bk-cal-h button:hover:not([disabled]) { background: color-mix(in srgb, var(--bk-text) 8%, transparent); }
        .tfw-bk-cal-h button[disabled] { opacity: .25; cursor: default; }
        .tfw-bk-cal-h svg { width: 18px; height: 18px; }
        .tfw-bk-wd, .tfw-bk-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
        .tfw-bk-wd span { font-size: 11px; font-weight: 600; color: var(--bk-muted); padding: 4px 0; text-transform: uppercase; }
        .tfw-bk-days button { height: 36px; border-radius: 10px; font-size: calc(var(--bk-fs) * .9); font-variant-numeric: tabular-nums; }
        .tfw-bk-days button:hover:not([disabled]) { background: color-mix(in srgb, var(--bk-accent) 16%, transparent); }
        .tfw-bk-days button[disabled] { opacity: .28; cursor: default; text-decoration: line-through; text-decoration-thickness: 1px; }
        .tfw-bk-days button.tfw-bk-today { box-shadow: inset 0 0 0 1px var(--bk-border); }
        .tfw-bk-days button.tfw-bk-sel { background: var(--bk-accent); color: var(--bk-accent-text); font-weight: 700; }
        .tfw-bk-days button:focus-visible { outline: 2px solid var(--bk-accent); outline-offset: 1px; }

        .tfw-bk-sum { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin: 2px 0 0; padding: .7em .9em; border-radius: calc(var(--bk-r) * .55);
            background: color-mix(in srgb, var(--bk-accent) 10%, transparent); font-size: calc(var(--bk-fs) * .9); font-weight: 600; color: var(--bk-text); }
        .tfw-bk-sum:empty { display: none; }
        .tfw-bk-sum svg { width: 1.1em; height: 1.1em; color: var(--bk-accent); flex: none; }
        .tfw-bk-consent { display: flex; gap: 10px; align-items: flex-start; font-size: calc(var(--bk-fs) * .84); color: var(--bk-muted); cursor: pointer; }
        .tfw-bk-consent input { flex: none; width: 18px; height: 18px; padding: 0; margin: 1px 0 0; border-radius: 5px; cursor: pointer; position: relative; }
        .tfw-bk-consent input:checked { background: var(--bk-accent); border-color: var(--bk-accent); }
        .tfw-bk-consent input:checked::after { content: ''; position: absolute; left: 5px; top: 1px; width: 5px; height: 10px; border: solid var(--bk-accent-text); border-width: 0 2px 2px 0; transform: rotate(45deg); }
        .tfw-bk-consent a { color: inherit; text-decoration: underline; }
        .tfw-bk-consent.tfw-bk-bad { color: #ef4444; }
        .tfw-bk-hp { position: absolute !important; left: -9999px !important; width: 1px !important; height: 1px !important; overflow: hidden !important; }
        .tfw-bk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin: 4px 0 0; padding: .85em 1.2em; min-height: 0;
            font: 700 var(--bk-fs)/1.2 var(--bk-font); color: var(--bk-accent-text); background: var(--bk-accent); border: 0; border-radius: var(--bk-btn-r);
            cursor: pointer; box-shadow: none; text-transform: none; letter-spacing: 0; text-decoration: none; transition: filter .15s, transform .15s; }
        .tfw-bk-btn:hover { filter: brightness(1.06); }
        .tfw-bk-btn:active { transform: translateY(1px); }
        .tfw-bk-btn svg { width: 1.1em; height: 1.1em; }
        .tfw-bk-btn[disabled] { opacity: .65; cursor: progress; }
        .tfw-bk-note { margin: 0; text-align: center; font-size: calc(var(--bk-fs) * .8); color: var(--bk-muted); }
        .tfw-bk-note:empty { display: none; }
        .tfw-bk-status { margin: 0; font-size: calc(var(--bk-fs) * .86); color: #ef4444; }
        .tfw-bk-status:empty { display: none; }
        .tfw-bk-done { display: none; text-align: center; padding: 18px 4px 6px; }
        .tfw-bk-done .tfw-bk-ok { display: inline-grid; place-items: center; width: 54px; height: 54px; margin-bottom: 12px; border-radius: 50%; background: var(--bk-accent); color: var(--bk-accent-text); }
        .tfw-bk-done .tfw-bk-ok svg { width: 28px; height: 28px; }
        .tfw-bk-done h3 { margin: 0 0 6px; font: 700 calc(var(--bk-fs) * 1.3)/1.25 var(--bk-font); color: var(--bk-text); }
        .tfw-bk-done p { margin: 0; color: var(--bk-muted); font-size: var(--bk-fs); }
        .tfw-bk-done .tfw-bk-sum { justify-content: center; margin: 14px 0 0; }
        .tfw-bk.tfw-bk-sent .tfw-bk-form, .tfw-bk.tfw-bk-sent .tfw-bk-head { display: none; }
        .tfw-bk.tfw-bk-sent .tfw-bk-done { display: block; }
        .tfw-bk-linkcard { text-align: center; }
        .tfw-bk-linkcard .tfw-bk-sub { margin-bottom: 16px; }

        .tfw-bk-launch { position: fixed; z-index: 2147482990; bottom: 22px; display: inline-flex; align-items: center; gap: 9px; margin: 0; padding: 13px 18px; min-height: 0;
            font: 700 15px/1 var(--bk-font); color: var(--bk-accent-text); background: var(--bk-accent); border: 0; border-radius: 999px; cursor: pointer; text-decoration: none;
            box-shadow: 0 12px 30px -8px rgba(0,0,0,.45); transition: transform .2s, filter .2s; }
        .tfw-bk-launch:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .tfw-bk-launch svg { width: 20px; height: 20px; flex: none; }
        .tfw-bk-launch.tfw-bk-right { right: 22px; } .tfw-bk-launch.tfw-bk-left { left: 22px; }
        .tfw-bk-launch.tfw-bk-icon-only { padding: 15px; } .tfw-bk-launch.tfw-bk-icon-only span { display: none; }
        .tfw-bk-modal { position: fixed; inset: 0; z-index: 2147482995; display: flex; align-items: center; justify-content: center; padding: 16px;
            background: rgba(0,0,0,.55); opacity: 0; visibility: hidden; transition: opacity .25s, visibility .25s; }
        .tfw-bk-modal.tfw-bk-open { opacity: 1; visibility: visible; }
        .tfw-bk-modal .tfw-bk-card { max-height: calc(100% - 0px); overflow: auto; transform: translateY(14px) scale(.98); transition: transform .3s cubic-bezier(.2,.8,.2,1); }
        .tfw-bk-modal.tfw-bk-open .tfw-bk-card { transform: none; }
        .tfw-bk-x { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 34px; height: 34px; margin: 0; padding: 0; min-height: 0;
            color: var(--bk-muted); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
        .tfw-bk-x:hover { background: color-mix(in srgb, var(--bk-text) 8%, transparent); color: var(--bk-text); }
        .tfw-bk-x svg { width: 20px; height: 20px; }
        .tfw-bk-modal .tfw-bk-title { padding-right: 34px; }
        @media (max-width: 560px) {
            .tfw-bk-row { grid-template-columns: 1fr; }
            .tfw-bk-launch { bottom: 16px; } .tfw-bk-launch.tfw-bk-right { right: 16px; } .tfw-bk-launch.tfw-bk-left { left: 16px; }
            .tfw-bk-modal { align-items: flex-end; padding: 0; }
            .tfw-bk-modal .tfw-bk-card { max-width: none; border-radius: var(--bk-r) var(--bk-r) 0 0; max-height: 92%; }
        }
        .tfw-bk-narrow .tfw-bk-row { grid-template-columns: 1fr; }
        @media (prefers-reduced-motion: reduce) { .tfw-bk *, .tfw-bk-modal, .tfw-bk-launch { transition: none !important; } }
    `;

    /* =========================================================
       ПУБЛИЧНЫЕ API
       ========================================================= */
    window.BusinessHoursWidgets = window.BusinessHoursWidgets || {};
    window.BusinessHoursWidgets.booking = window.BusinessHoursWidgets.booking || {};

    // Живое превью для конфигуратора: BHWBooking.render(container, config) -> { update, open, destroy }
    var api = window.BHWBooking = window.BHWBooking || {};
    api.version = VERSION;
    api.defaults = getDefaultConfig;
    api.strings = function (lang) { return I18N[lang] || I18N.en; };
    api.languages = Object.keys(I18N);
    api.presetFields = PRESET_FIELDS;
    api.platforms = PLATFORMS;
    api.checkAccess = bhwCheckAccess;
    api.render = function (container, config) {
        var noop = { destroy: function () {}, update: function () {}, open: function () {}, el: null };
        if (!bhwCheckAccess({ domains: PREVIEW_DOMAINS }).ok) { console.warn(LOG, 'preview is only available on tf-widgets.com'); return noop; }
        injectBaseStyles();
        if (container._tfwBkDestroy) container._tfwBkDestroy();
        var cls = container.__tfwBkClass || (container.__tfwBkClass = 'tfw-bk-preview-' + Math.random().toString(36).slice(2, 8));
        var widget = null;
        var ctrl = {
            el: null,
            update: function (cfg) {
                var open = widget ? widget.isOpen() : false;
                if (widget) widget.destroy();
                widget = mountWidget(normalizeConfig(cfg || {}), cls, 'preview', { preview: container, open: open });
                ctrl.el = widget.root;
            },
            open: function () { if (widget) widget.open(); },
            destroy: function () { if (widget) widget.destroy(); widget = null; ctrl.el = null; container._tfwBkDestroy = null; }
        };
        ctrl.update(config);
        container._tfwBkDestroy = ctrl.destroy;
        return ctrl;
    };

    /* =========================================================
       АВТОЗАПУСК ПО <script data-id="..."> (только свой тег)
       ========================================================= */
    try {
        var currentScript = document.currentScript || (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (currentScript && currentScript.dataset && currentScript.dataset.id && currentScript.dataset.bhwMounted !== '1') {
            currentScript.dataset.bhwMounted = '1';
            var debug = currentScript.dataset.debug === '1';
            var clientId = normalizeId(currentScript.dataset.id);
            var baseUrl = getBasePath(currentScript.src);
            var apiBase = String(currentScript.dataset.api || API).replace(/\/+$/, '');
            // место для формы: элемент с data-tfw-booking="ID" или id="tfw-booking", иначе — сразу после тега <script>
            var anchor = document.querySelector('[data-tfw-booking="' + clientId + '"]') || document.getElementById('tfw-booking');
            var marker = null;
            if (!anchor && currentScript.parentNode && currentScript.parentNode !== document.head) {
                marker = document.createElement('div');
                currentScript.parentNode.insertBefore(marker, currentScript.nextSibling);
            }
            loadConfig(clientId, baseUrl)
                .then(function (fetched) {
                    var access = bhwCheckAccess(fetched);
                    if (!access.ok) {
                        console.warn(LOG, 'widget "' + clientId + '" is not active on ' + (location.hostname || 'this page') + ': ' + access.reason);
                        if (marker) marker.remove();
                        return;
                    }
                    var cfg = normalizeConfig(fetched);
                    if (debug) console.log(LOG, 'config "' + clientId + '":', cfg);
                    injectBaseStyles();
                    var mount = function () {
                        var w = mountWidget(cfg, 'tfw-bk-' + clientId.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now(), clientId, { anchor: anchor || marker, api: apiBase });
                        window.BusinessHoursWidgets.booking[clientId] = w;
                    };
                    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
                })
                .catch(function (error) {
                    console.warn(LOG, 'config "' + clientId + '" not loaded:', error.message);
                });
        }
    } catch (error) {
        console.error(LOG, 'critical error:', error);
    }

    /* =========================================================
       ФУНКЦИИ
       ========================================================= */
    function injectBaseStyles() {
        if (!document.getElementById('tfw-booking-styles')) {
            var style = document.createElement('style');
            style.id = 'tfw-booking-styles';
            style.textContent = inlineCSS;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    /* ---------------------------------------------------------
       ДОСТУП (общий блок для всех виджетов TF Widgets — копировать без изменений)
       --------------------------------------------------------- */
    function bhwCheckAccess(config) {
        config = config || {};
        if (config.active === false) return { ok: false, reason: 'widget is switched off ("active": false)' };
        var host = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return { ok: true };
        var list = config.domains;
        if (typeof list === 'string') list = list.split(/[\s,]+/);
        if (!Array.isArray(list) || !list.length) return { ok: false, reason: 'no "domains" in config' };
        for (var i = 0; i < list.length; i++) {
            var d = String(list[i] || '').trim().toLowerCase()
                .replace(/^[a-z]+:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
            if (!d) continue;
            if (d.indexOf('*.') === 0) {
                var base = d.slice(2);
                if (host === base || host.slice(-(base.length + 1)) === '.' + base) return { ok: true };
            } else if (host === d) {
                return { ok: true };
            }
        }
        return { ok: false, reason: 'domain is not in "domains"' };
    }

    function normalizeId(id) { return String(id || 'demo').replace(/\.(json|js)$/i, ''); }
    function getBasePath(src) {
        if (!src) return './';
        try { var url = new URL(src, location.href); return url.origin + url.pathname.replace(/\/[^\/]*$/, '/'); }
        catch (error) { return './'; }
    }
    function loadConfig(clientId, baseUrl) {
        if (clientId === 'local') {
            var el = document.querySelector('#tfw-bk-local-config');
            if (!el) return Promise.reject(new Error('#tfw-bk-local-config not found'));
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { return Promise.reject(e); }
        }
        var url = baseUrl + 'configs/' + encodeURIComponent(clientId) + '.json?v=' + Date.now();
        return fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function getDefaultConfig() {
        return {
            mode: 'form',                   // form — форма запроса; link — кнопка на внешнюю систему записи
            display: 'inline',              // inline — на странице; popup — плавающая кнопка + окно
            preset: 'services',             // services | trades | restaurant | rental
            lang: 'en',
            title: '', subtitle: '', submitText: '', successTitle: '', successText: '', note: '',
            services: [{ name: 'Haircut', duration: 45, price: '€35' }, { name: 'Colouring', duration: 90, price: '€70' }, { name: 'Manicure', duration: 60, price: '€30' }],
            staff: [],
            jobs: ['Repair', 'Installation', 'Inspection / quote'],
            items: ['Room', 'Equipment'],
            occasions: ['Birthday', 'Anniversary', 'Business meal'],
            maxGuests: 10,
            fields: {},
            schedule: { days: [1, 2, 3, 4, 5, 6], open: '09:00', close: '18:00', step: 30, notice: 2, ahead: 60, closed: [] },
            timezone: '',
            consent: { on: false, text: '', linkText: '', url: '' },
            launcher: { text: '', position: 'right', iconOnly: false },
            link: { platform: 'other', url: '', text: '' },
            style: {
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                colors: { background: '#ffffff', text: '#111111', muted: '#6b7280', field: '#ffffff', border: '#e5e7eb', accent: '#25d366', accentText: '#052e16' },
                sizes: { width: 560, radius: 16, buttonRadius: 12, fontSize: 15, padding: 28 },
                shadow: '0 20px 50px -20px rgba(0,0,0,.25)'
            }
        };
    }
    // поля по умолчанию: что включено и что обязательно
    var FIELD_DEFAULTS = {
        service: [1, 1], staff: [0, 0], job: [1, 1], item: [1, 1], address: [1, 1], date: [1, 1], time: [1, 1], window: [1, 0],
        start: [1, 1], end: [1, 1], guests: [1, 1], occasion: [0, 0], details: [1, 1], name: [1, 1], phone: [1, 1], email: [1, 0], comment: [1, 0]
    };

    function normalizeConfig(raw) {
        raw = raw || {};
        var def = getDefaultConfig();
        var cfg = mergeDeep(def, raw);
        cfg.mode = cfg.mode === 'link' ? 'link' : 'form';
        cfg.display = cfg.display === 'popup' ? 'popup' : 'inline';
        if (!PRESET_FIELDS[cfg.preset]) cfg.preset = 'services';
        if (!I18N[cfg.lang]) cfg.lang = 'en';
        ['services', 'staff', 'jobs', 'items', 'occasions'].forEach(function (k) { cfg[k] = Array.isArray(raw[k]) ? raw[k] : def[k]; });
        cfg.services = cfg.services.map(function (s) { return isObj(s) ? { name: str(s.name, 80), duration: clamp(s.duration, 0, 1440, 0), price: str(s.price, 30) } : null; })
            .filter(function (s) { return s && s.name; }).slice(0, 40);
        ['staff', 'jobs', 'items', 'occasions'].forEach(function (k) { cfg[k] = cfg[k].map(function (x) { return str(x, 80); }).filter(Boolean).slice(0, 30); });
        cfg.maxGuests = Math.round(clamp(cfg.maxGuests, 1, 100, 10));
        var F = {}, rf = isObj(raw.fields) ? raw.fields : {};
        ALL_FIELDS.forEach(function (k) {
            var d = FIELD_DEFAULTS[k], r = isObj(rf[k]) ? rf[k] : {};
            var on = r.on === undefined ? !!d[0] : !!r.on, req = r.required === undefined ? !!d[1] : !!r.required;
            F[k] = { on: on, required: on && req, label: str(r.label, 60) };
        });
        // поля без которых форма не имеет смысла
        F.name.on = true; F.date.on = true; F.start.on = true; F.end.on = true;
        ['service', 'job', 'item'].forEach(function (k) { if (F[k].on) F[k].required = true; });
        if (!F.phone.on && !F.email.on) F.email.on = true;
        cfg.fields = F;
        var s = isObj(raw.schedule) ? raw.schedule : {};
        cfg.schedule = {
            days: (Array.isArray(s.days) ? s.days : def.schedule.days).map(Number).filter(function (d) { return d >= 0 && d <= 6; }),
            open: hhmm(s.open) != null ? s.open : def.schedule.open,
            close: hhmm(s.close) != null ? s.close : def.schedule.close,
            step: [15, 30, 60].indexOf(Number(s.step)) >= 0 ? Number(s.step) : 30,
            notice: clamp(s.notice, 0, 720, 2),
            ahead: Math.round(clamp(s.ahead, 1, 365, 60)),
            closed: (Array.isArray(s.closed) ? s.closed : []).filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }).slice(0, 100)
        };
        if (!cfg.schedule.days.length) cfg.schedule.days = def.schedule.days;
        if (hhmm(cfg.schedule.close) <= hhmm(cfg.schedule.open)) cfg.schedule.close = '24:00';
        cfg.timezone = validTz(cfg.timezone) ? cfg.timezone : '';
        cfg.consent = mergeDeep(def.consent, isObj(raw.consent) ? raw.consent : {});
        cfg.launcher = mergeDeep(def.launcher, isObj(raw.launcher) ? raw.launcher : {});
        cfg.launcher.position = cfg.launcher.position === 'left' ? 'left' : 'right';
        cfg.link = mergeDeep(def.link, isObj(raw.link) ? raw.link : {});
        if (!(cfg.link.platform in PLATFORMS)) cfg.link.platform = 'other';
        return cfg;
    }

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function str(v, max) { return typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : ''; }
    function mergeDeep(base, over) {
        var out = {};
        Object.keys(base || {}).forEach(function (k) { out[k] = isObj(base[k]) ? mergeDeep(base[k], {}) : base[k]; });
        Object.keys(over || {}).forEach(function (k) {
            var v = over[k];
            if (isObj(v) && isObj(out[k])) out[k] = mergeDeep(out[k], v);
            else if (v !== undefined) out[k] = v;
        });
        return out;
    }
    function cssValue(v, fallback) { if (v === undefined || v === null || v === '') return fallback; return String(v).replace(/[;{}<>]/g, ''); }
    function num(v, fallback) { var n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : fallback; }
    function clamp(v, a, b, d) { return Math.min(b, Math.max(a, num(v, d))); }
    function safeUrl(url) {
        var u = String(url || '').trim();
        if (!u) return '';
        if (/^https?:/i.test(u) || /^\/(?!\/)/.test(u)) return u;
        if (/^[\w.-]+\.[a-z]{2,}(\/|$|\?)/i.test(u)) return 'https://' + u;
        return '';
    }
    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function hhmm(v) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '')); if (!m) return null; var t = +m[1] * 60 + +m[2]; return t >= 0 && t <= 1440 && +m[2] < 60 ? t : null; }
    function fmtMin(t) { return ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2); }
    function validTz(tz) { if (!tz || typeof tz !== 'string') return false; try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch (e) { return false; } }

    /* ---------- дата и время в часовом поясе бизнеса ---------- */
    // «Сейчас» у бизнеса как наивная дата (UTC-поля = местное время бизнеса)
    function bizNow(tz) {
        var d = new Date();
        if (tz) {
            try {
                var p = {};
                new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
                    .formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
                return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute));
            } catch (e) {}
        }
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()));
    }
    function ymd(d) { return d.toISOString().slice(0, 10); }
    function parseYmd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
    function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }

    function Rules(cfg) {
        var S = cfg.schedule;
        var now = bizNow(cfg.timezone);
        var earliest = new Date(now.getTime() + S.notice * 3600e3);
        var today = parseYmd(ymd(now));
        var eDay = parseYmd(ymd(earliest));
        var eMin = earliest.getUTCHours() * 60 + earliest.getUTCMinutes();
        var last = addDays(today, S.ahead);
        var open = hhmm(S.open), close = hhmm(S.close);
        var closed = {}; S.closed.forEach(function (d) { closed[d] = 1; });
        var R = {
            today: today, first: eDay, last: last,
            slots: function (dayStr, dur) {
                var d = parseYmd(dayStr); if (!d) return [];
                var out = [], end = close - Math.max(dur || 0, 0);
                if (end < open) end = open;
                for (var t = open; t <= end && t < 1440; t += S.step) {
                    if (dayStr === ymd(eDay) && t < eMin) continue;
                    out.push(t);
                }
                return out;
            },
            dayOk: function (d, needSlots, dur) {
                if (!d || d < eDay || d > last) return false;
                if (S.days.indexOf(d.getUTCDay()) < 0) return false;
                if (closed[ymd(d)]) return false;
                if (needSlots && ymd(d) === ymd(eDay) && !R.slots(ymd(d), dur).length) return false;
                if (!needSlots && ymd(d) === ymd(eDay) && eMin > close - 30) return false;
                return true;
            }
        };
        return R;
    }

    function applyCustomStyles(uniqueClass, style) {
        var id = 'tfw-bk-style-' + uniqueClass;
        var el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; (document.head || document.documentElement).appendChild(el); }
        var s = style || {}, c = s.colors || {}, z = s.sizes || {};
        var sel = '.' + uniqueClass;
        el.textContent = sel + '{' +
            '--bk-font:' + cssValue(s.fontFamily, "'Inter', system-ui, sans-serif") + ';' +
            '--bk-bg:' + cssValue(c.background, '#ffffff') + ';' +
            '--bk-text:' + cssValue(c.text, '#111111') + ';' +
            '--bk-muted:' + cssValue(c.muted, '#6b7280') + ';' +
            '--bk-field:' + cssValue(c.field, '#ffffff') + ';' +
            '--bk-border:' + cssValue(c.border, '#e5e7eb') + ';' +
            '--bk-accent:' + cssValue(c.accent, '#25d366') + ';' +
            '--bk-accent-text:' + cssValue(c.accentText, '#052e16') + ';' +
            '--bk-w:' + clamp(z.width, 300, 900, 560) + 'px;' +
            '--bk-r:' + clamp(z.radius, 0, 32, 16) + 'px;' +
            '--bk-btn-r:' + clamp(z.buttonRadius, 0, 999, 12) + 'px;' +
            '--bk-fs:' + clamp(z.fontSize, 13, 19, 15) + 'px;' +
            '--bk-pad:' + clamp(z.padding, 14, 48, 28) + 'px;' +
            '--bk-shadow:' + cssValue(s.shadow, 'none') + ';' +
            '}';
        return id;
    }

    function mountWidget(cfg, uniqueClass, id, opts) {
        opts = opts || {};
        var preview = opts.preview || null;
        var T = I18N[cfg.lang] || I18N.en;
        var F = cfg.fields;
        var popup = cfg.display === 'popup';
        var isLink = cfg.mode === 'link';
        var styleId = applyCustomStyles(uniqueClass, cfg.style);
        var uid = 'tfwbk' + Math.random().toString(36).slice(2, 7);
        var cleanups = [];
        function on(t, e, h, o) { if (!t) return; t.addEventListener(e, h, o); cleanups.push(function () { t.removeEventListener(e, h, o); }); }
        function lab(k) { return (F[k] && F[k].label) || T[k] || k; }
        var title = cfg.title || T['t_' + cfg.preset], sub = cfg.subtitle !== undefined && cfg.subtitle !== '' ? cfg.subtitle : T['s_' + cfg.preset];
        var keys = PRESET_FIELDS[cfg.preset].filter(function (k) { return F[k] && F[k].on && (k !== 'staff' || cfg.staff.length) && (k !== 'occasion' || cfg.occasions.length); });
        var rules = Rules(cfg);
        var dfmt, sfmt, tfmt;
        try {
            dfmt = new Intl.DateTimeFormat(cfg.lang, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
            sfmt = new Intl.DateTimeFormat(cfg.lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
            tfmt = new Intl.DateTimeFormat(cfg.lang, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
        } catch (e) { dfmt = sfmt = tfmt = { format: function (d) { return d.toISOString().slice(0, 10); } }; }
        function fDate(s) { var d = parseYmd(s); return d ? dfmt.format(d) : ''; }
        function fTime(t) { return tfmt.format(new Date(Date.UTC(2000, 0, 1, Math.floor(t / 60), t % 60))); }

        /* ---------- разметка ---------- */
        function req(k) { return F[k] && F[k].required; }
        function wrap(k, inner, extra) {
            return '<div class="tfw-bk-f" data-k="' + k + '"><span id="' + uid + '-l-' + k + '">' + escapeHtml(lab(k)) + (req(k) ? '<i aria-hidden="true">*</i>' : '') + '</span>' + inner + (extra || '') + '<em class="tfw-bk-err"></em></div>';
        }
        function select(k, opts, ph) {
            return wrap(k, '<select id="' + uid + '-' + k + '" name="' + k + '" aria-labelledby="' + uid + '-l-' + k + '" class="tfw-bk-empty"' + (req(k) ? ' required' : '') + '>' +
                '<option value="">' + escapeHtml(ph || T.select) + '</option>' + opts.map(function (o) { return '<option value="' + escapeHtml(o[0]) + '">' + escapeHtml(o[1]) + '</option>'; }).join('') + '</select>');
        }
        function picker(k, name) {
            return '<button type="button" class="tfw-bk-pick tfw-bk-empty" data-pick="' + name + '" aria-haspopup="dialog" aria-expanded="false" aria-labelledby="' + uid + '-l-' + k + '">' + ICONS.cal + '<b>' + escapeHtml(T.pickDate) + '</b></button>' +
                '<input type="hidden" name="' + name + '"><div class="tfw-bk-cal" hidden role="dialog" aria-label="' + escapeHtml(T.pickDate) + '"></div>';
        }
        function timeSel(name, k) {
            return '<select name="' + name + '" class="tfw-bk-empty" aria-labelledby="' + uid + '-l-' + k + '"' + (req(k) ? ' required' : '') + '><option value="">' + escapeHtml(T.pickTime) + '</option></select>';
        }
        function input(k, type, ac, max) {
            return wrap(k, '<input id="' + uid + '-' + k + '" name="' + k + '" type="' + type + '" autocomplete="' + ac + '" maxlength="' + max + '"' + (req(k) ? ' required aria-required="true"' : '') + '>');
        }
        function field(k) {
            if (k === 'service') return select(k, cfg.services.map(function (s, i) {
                var extra = [s.duration ? s.duration + ' ' + T.min : '', s.price].filter(Boolean).join(' · ');
                return [s.name, s.name + (extra ? ' — ' + extra : '')];
            }));
            if (k === 'staff') return select(k, [[T.anyStaff, T.anyStaff]].concat(cfg.staff.map(function (x) { return [x, x]; })));
            if (k === 'job') return select(k, cfg.jobs.map(function (x) { return [x, x]; }));
            if (k === 'item') return select(k, cfg.items.map(function (x) { return [x, x]; }));
            if (k === 'occasion') return select(k, cfg.occasions.map(function (x) { return [x, x]; }));
            if (k === 'guests') { var g = []; for (var i = 1; i <= cfg.maxGuests; i++) g.push([String(i), i + ' ' + (i === 1 ? T.guest1 : T.guestN)]); return select(k, g); }
            if (k === 'window') return select(k, [['morning', T.morning], ['afternoon', T.afternoon], ['evening', T.evening], ['any', T.anyTime]]);
            if (k === 'date') return wrap(k, picker(k, 'date'));
            if (k === 'time') return wrap(k, timeSel('time', k));
            if (k === 'start' || k === 'end') {
                var withTime = F.time.on;
                var dn = k === 'start' ? 'date' : 'endDate', tn = k === 'start' ? 'time' : 'endTime';
                return wrap(k, withTime ? '<div class="tfw-bk-row" style="gap:8px">' + '<div class="tfw-bk-f" style="gap:0">' + picker(k, dn) + '</div>' + timeSel(tn, k) + '</div>' : picker(k, dn));
            }
            if (k === 'address') return input(k, 'text', 'street-address', 200);
            if (k === 'name') return input(k, 'text', 'name', 120);
            if (k === 'phone') return input(k, 'tel', 'tel', 40);
            if (k === 'email') return input(k, 'email', 'email', 120);
            if (k === 'comment' || k === 'details') return wrap(k, '<textarea id="' + uid + '-' + k + '" name="' + k + '" maxlength="2000"' + (req(k) ? ' required' : '') + '></textarea>');
            return '';
        }
        function formRows() {
            var rows = [], pend = null;
            var pairable = { date: 1, time: 1, window: 1, guests: 1, phone: 1, email: 1, occasion: 1 };
            keys.forEach(function (k) {
                var h = field(k);
                if (pairable[k]) {
                    if (pend) { rows.push('<div class="tfw-bk-row">' + pend + h + '</div>'); pend = null; }
                    else pend = h;
                } else { if (pend) { rows.push(pend); pend = null; } rows.push(h); }
            });
            if (pend) rows.push(pend);
            return rows.join('');
        }
        function headHtml(closable) {
            return '<div class="tfw-bk-head">' +
                (title ? '<h2 class="tfw-bk-title" id="' + uid + '-t">' + escapeHtml(title) + '</h2>' : '<span id="' + uid + '-t" hidden>Booking</span>') +
                (sub ? '<p class="tfw-bk-sub">' + escapeHtml(sub) + '</p>' : '') + '</div>';
        }
        function cardHtml(closable) {
            var x = closable ? '<button class="tfw-bk-x" type="button" aria-label="' + escapeHtml(T.close) + '">' + ICONS.close + '</button>' : '';
            var consent = '';
            if (cfg.consent.on) {
                var link = safeUrl(cfg.consent.url);
                consent = '<label class="tfw-bk-consent"><input type="checkbox" name="_consent" required> <span>' + escapeHtml(cfg.consent.text || T.consent) +
                    (link ? ' <a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(cfg.consent.linkText || T.privacy) + '</a>' : '') + '</span></label>';
            }
            return '<div class="tfw-bk-card" role="' + (closable ? 'dialog' : 'region') + '"' + (closable ? ' aria-modal="true"' : '') + ' aria-labelledby="' + uid + '-t">' + x + headHtml() +
                '<form class="tfw-bk-form" novalidate>' + formRows() +
                    '<div class="tfw-bk-hp" aria-hidden="true"><label>Company website<input type="text" name="_website" tabindex="-1" autocomplete="off"></label></div>' +
                    '<div class="tfw-bk-sum" aria-live="polite"></div>' + consent +
                    '<p class="tfw-bk-status" role="alert" aria-live="assertive"></p>' +
                    '<button class="tfw-bk-btn" type="submit"><span>' + escapeHtml(cfg.submitText || T.submit) + '</span>' + ICONS.arrow + '</button>' +
                    '<p class="tfw-bk-note">' + escapeHtml(cfg.note || '') + '</p>' +
                '</form>' +
                '<div class="tfw-bk-done" role="status" aria-live="polite"><span class="tfw-bk-ok">' + ICONS.check + '</span><h3>' + escapeHtml(cfg.successTitle || T.successTitle) + '</h3><p>' + escapeHtml(cfg.successText || T.successText) + '</p><div class="tfw-bk-sum tfw-bk-sum2"></div></div>' +
            '</div>';
        }
        function linkUrl() { return safeUrl(cfg.link.url) || (preview ? '#' : ''); }
        function linkText() { var p = PLATFORMS[cfg.link.platform]; return cfg.link.text || (p ? T.linkOn.replace('{p}', p) : T.linkBtn); }
        function linkCardHtml() {
            var u = linkUrl();
            return '<div class="tfw-bk-card tfw-bk-linkcard" role="region" aria-labelledby="' + uid + '-t">' + headHtml() +
                '<a class="tfw-bk-btn" href="' + escapeHtml(u || '#') + '" target="_blank" rel="noopener noreferrer">' + ICONS.cal + '<span>' + escapeHtml(linkText()) + '</span>' + ICONS.ext + '</a>' +
                '<p class="tfw-bk-note" style="margin-top:10px">' + escapeHtml(cfg.note || '') + '</p></div>';
        }

        var root = document.createElement('div');
        root.id = 'tfw-booking-' + id;
        root.className = 'tfw-bk ' + uniqueClass;
        var launch = null, modal = null, lastFocus = null;
        var host = preview || null;

        if (isLink) {
            if (!popup) {
                root.innerHTML = linkCardHtml();
                (preview || opts.anchor || document.body).appendChild(root);
            } else {
                launch = document.createElement('a');
                launch.href = linkUrl() || '#';
                launch.target = '_blank'; launch.rel = 'noopener noreferrer';
                launch.className = 'tfw-bk-launch tfw-bk ' + uniqueClass + ' tfw-bk-' + cfg.launcher.position + (cfg.launcher.iconOnly ? ' tfw-bk-icon-only' : '');
                launch.setAttribute('aria-label', cfg.launcher.text || linkText());
                launch.innerHTML = ICONS.cal + '<span>' + escapeHtml(cfg.launcher.text || T.launcher) + '</span>';
                if (preview) { launch.style.position = 'absolute'; on(launch, 'click', function (e) { e.preventDefault(); }); }
                (preview || document.body).appendChild(launch);
                root = launch;
            }
            if (preview && !popup) on(root.querySelector('a'), 'click', function (e) { if (!safeUrl(cfg.link.url)) e.preventDefault(); });
            return {
                root: root, config: cfg, id: id, launcher: launch,
                isOpen: function () { return false; }, open: function () {}, close: function () {},
                destroy: function () { cleanups.forEach(function (f) { try { f(); } catch (e) {} }); root.remove(); var s = document.getElementById(styleId); if (s) s.remove(); }
            };
        }

        if (!popup) {
            root.innerHTML = cardHtml(false);
            (preview || opts.anchor || document.body).appendChild(root);
        } else {
            var L = cfg.launcher;
            launch = document.createElement('button');
            launch.type = 'button';
            launch.className = 'tfw-bk-launch tfw-bk ' + uniqueClass + ' tfw-bk-' + L.position + (L.iconOnly ? ' tfw-bk-icon-only' : '');
            launch.setAttribute('aria-haspopup', 'dialog');
            launch.setAttribute('aria-label', L.text || T.launcher);
            launch.innerHTML = ICONS.cal + '<span>' + escapeHtml(L.text || T.launcher) + '</span>';
            modal = document.createElement('div');
            modal.className = 'tfw-bk-modal';
            root.innerHTML = cardHtml(true);
            modal.appendChild(root);
            var mh = preview || document.body;
            if (preview) { launch.style.position = 'absolute'; modal.style.position = 'absolute'; }
            mh.appendChild(launch);
            mh.appendChild(modal);
            on(launch, 'click', function () { widget.open(); });
            on(modal, 'click', function (e) { if (e.target === modal) widget.close(); });
            on(root.querySelector('.tfw-bk-x'), 'click', function () { widget.close(); });
        }
        on(document, 'keydown', function (e) {
            if (e.key === 'Escape') {
                var openCal = root.querySelector('.tfw-bk-cal:not([hidden])');
                if (openCal) { closeCals(true); return; }
                if (modal && modal.classList.contains('tfw-bk-open')) widget.close();
            }
            if (e.key === 'Tab' && modal && modal.classList.contains('tfw-bk-open')) {   // фокус не уходит из окна
                var els = [].slice.call(root.querySelectorAll('button, input:not([type=hidden]), select, textarea, a[href]')).filter(function (x) { return x.offsetParent !== null && !x.closest('.tfw-bk-hp'); });
                if (!els.length) return;
                if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
                else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
            }
        });

        var form = root.querySelector('.tfw-bk-form');
        function fe(n) { return form.elements.namedItem(n); }   // не form.elements[n]: «item» — это метод коллекции
        var status = root.querySelector('.tfw-bk-status');
        var btn = root.querySelector('.tfw-bk-btn');
        var sumEl = root.querySelector('.tfw-bk-sum');
        var started = Date.now();
        // узкий блок (например, колонка сайта) — поля в один столбец
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(function () { var c = root.querySelector('.tfw-bk-card'); if (c) root.classList.toggle('tfw-bk-narrow', c.clientWidth < 440); });
            ro.observe(root); cleanups.push(function () { ro.disconnect(); });
        }

        /* ---------- календарь ---------- */
        function duration() {
            if (cfg.preset !== 'services' || !fe('service')) return 0;
            var s = cfg.services.filter(function (x) { return x.name === fe('service').value; })[0];
            return s ? s.duration : 0;
        }
        function needSlots(name) { return (name === 'date' && (cfg.preset === 'services' || cfg.preset === 'restaurant')) || (cfg.preset === 'rental' && F.time.on); }
        function minDate(name) {
            if (name === 'endDate') { var s = parseYmd(fe('date').value); if (s && s > rules.first) return s; }
            return rules.first;
        }
        function dayAllowed(name, d) {
            if (d < minDate(name)) return false;
            return rules.dayOk(d, needSlots(name), name === 'date' ? duration() : 0);
        }
        function closeCals(focus) {
            root.querySelectorAll('.tfw-bk-cal').forEach(function (c) {
                if (c.hidden) return;
                c.hidden = true;
                var b = c.parentNode.querySelector('.tfw-bk-pick'); b.setAttribute('aria-expanded', 'false');
                if (focus) b.focus();
            });
        }
        function drawCal(cal, name, month) {
            var sel = fe(name).value;
            var m0 = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
            var lastM = new Date(Date.UTC(rules.last.getUTCFullYear(), rules.last.getUTCMonth(), 1));
            var firstM = new Date(Date.UTC(rules.first.getUTCFullYear(), rules.first.getUTCMonth(), 1));
            var wdFmt; try { wdFmt = new Intl.DateTimeFormat(cfg.lang, { weekday: 'narrow', timeZone: 'UTC' }); } catch (e) { wdFmt = { format: function (d) { return 'SMTWTFS'[d.getUTCDay()]; } }; }
            var wd = ''; for (var i = 0; i < 7; i++) wd += '<span>' + escapeHtml(wdFmt.format(new Date(Date.UTC(2024, 0, 1 + i)))) + '</span>';   // 1 янв 2024 — понедельник
            var lead = (m0.getUTCDay() + 6) % 7, days = '';
            for (var j = 0; j < lead; j++) days += '<span></span>';
            var dim = new Date(Date.UTC(m0.getUTCFullYear(), m0.getUTCMonth() + 1, 0)).getUTCDate();
            for (var dd = 1; dd <= dim; dd++) {
                var d = new Date(Date.UTC(m0.getUTCFullYear(), m0.getUTCMonth(), dd)), s = ymd(d), ok = dayAllowed(name, d);
                days += '<button type="button" data-d="' + s + '"' + (ok ? '' : ' disabled') + ' class="' + (s === sel ? 'tfw-bk-sel ' : '') + (s === ymd(rules.today) ? 'tfw-bk-today' : '') + '" aria-label="' + escapeHtml(fDate(s)) + '"' + (s === sel ? ' aria-pressed="true"' : '') + '>' + dd + '</button>';
            }
            cal.innerHTML = '<div class="tfw-bk-cal-h"><button type="button" data-nav="-1" aria-label="' + escapeHtml(T.prev) + '"' + (m0 <= firstM ? ' disabled' : '') + '>' + ICONS.left + '</button>' +
                '<span>' + escapeHtml(sfmt.format(m0)) + '</span><button type="button" data-nav="1" aria-label="' + escapeHtml(T.next) + '"' + (m0 >= lastM ? ' disabled' : '') + '>' + ICONS.right + '</button></div>' +
                '<div class="tfw-bk-wd" aria-hidden="true">' + wd + '</div><div class="tfw-bk-days">' + days + '</div>';
            cal._month = m0;
        }
        function firstAllowed(name) {
            for (var d = minDate(name), n = 0; n < 400 && d <= rules.last; n++, d = addDays(d, 1)) if (dayAllowed(name, d)) return d;
            return minDate(name);
        }
        on(form, 'click', function (e) {
            var p = e.target.closest('.tfw-bk-pick');
            if (p) {
                var cal = p.parentNode.querySelector('.tfw-bk-cal'), name = p.dataset.pick;
                var wasOpen = !cal.hidden;
                closeCals();
                if (wasOpen) return;
                var cur = parseYmd(fe(name).value) || firstAllowed(name);
                drawCal(cal, name, cur);
                cal.hidden = false; p.setAttribute('aria-expanded', 'true');
                var b = cal.querySelector('.tfw-bk-sel') || cal.querySelector('.tfw-bk-days button:not([disabled])');
                if (b) b.focus({ preventScroll: true });
                return;
            }
            var nav = e.target.closest('[data-nav]');
            if (nav) { var c = nav.closest('.tfw-bk-cal'), nm = c.parentNode.querySelector('.tfw-bk-pick').dataset.pick, m = c._month; drawCal(c, nm, new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + Number(nav.dataset.nav), 1))); return; }
            var day = e.target.closest('[data-d]');
            if (day && !day.disabled) {
                var c2 = day.closest('.tfw-bk-cal'), pk = c2.parentNode.querySelector('.tfw-bk-pick');
                setDate(pk.dataset.pick, day.dataset.d);
                closeCals(true);
            }
        });
        on(document, 'mousedown', function (e) { var t = e.target; if (!t || !t.closest || !t.closest('.tfw-bk-cal, .tfw-bk-pick')) closeCals(); });
        on(form, 'keydown', function (e) {
            var b = e.target.closest && e.target.closest('.tfw-bk-days button');
            if (!b) return;
            var mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
            if (!mv) return;
            e.preventDefault();
            var c = b.closest('.tfw-bk-cal'), name = c.parentNode.querySelector('.tfw-bk-pick').dataset.pick;
            var d = addDays(parseYmd(b.dataset.d), mv);
            if (d < rules.first || d > rules.last) return;
            if (d.getUTCMonth() !== c._month.getUTCMonth()) drawCal(c, name, d);
            var t = c.querySelector('[data-d="' + ymd(d) + '"]'); if (t) t.focus();
        });
        function setDate(name, val) {
            fe(name).value = val;
            var pk = form.querySelector('[data-pick="' + name + '"]');
            pk.querySelector('b').textContent = val ? fDate(val) : T.pickDate;
            pk.classList.toggle('tfw-bk-empty', !val);
            var box = pk.closest('.tfw-bk-f[data-k]'); if (box) setBad(box.dataset.k, '');
            if (name === 'date') {
                fillTimes('time', val);
                if (fe('endDate') && fe('endDate').value && fe('endDate').value < val) setDate('endDate', '');
            }
            if (name === 'endDate') fillTimes('endTime', val);
            summary();
        }
        function fillTimes(name, day) {
            var s = fe(name); if (!s) return;
            var keep = s.value, list = day ? rules.slots(day, name === 'time' ? duration() : 0) : [];
            if (name === 'endTime') { list = []; if (day) for (var t = hhmm(cfg.schedule.open) + cfg.schedule.step; t <= hhmm(cfg.schedule.close) && t < 1440; t += cfg.schedule.step) list.push(t); }
            s.innerHTML = '<option value="">' + escapeHtml(day && !list.length ? T.noTimes : T.pickTime) + '</option>' +
                list.map(function (t) { return '<option value="' + fmtMin(t) + '">' + escapeHtml(fTime(t)) + '</option>'; }).join('');
            s.value = list.some(function (t) { return fmtMin(t) === keep; }) ? keep : '';
            s.classList.toggle('tfw-bk-empty', !s.value);
        }
        ['time', 'endTime'].forEach(function (n) { if (fe(n)) fillTimes(n, ''); });

        /* ---------- сводка ---------- */
        function summary() {
            var v = function (n) { var el = fe(n); return el ? String(el.value || '') : ''; };
            var parts = [];
            if (cfg.preset === 'rental') {
                if (v('date')) parts.push(fDate(v('date')) + (v('time') ? ' ' + fTime(hhmm(v('time'))) : ''));
                if (v('endDate')) parts.push('→ ' + fDate(v('endDate')) + (v('endTime') ? ' ' + fTime(hhmm(v('endTime'))) : ''));
            } else {
                if (v('date')) parts.push(fDate(v('date')));
                if (v('time')) parts.push(fTime(hhmm(v('time'))));
                if (v('window')) parts.push({ morning: T.morning, afternoon: T.afternoon, evening: T.evening, any: T.anyTime }[v('window')] || '');
                if (v('guests')) parts.push(v('guests') + ' ' + (v('guests') === '1' ? T.guest1 : T.guestN));
            }
            if (v('service')) parts.unshift(v('service'));
            if (v('job')) parts.unshift(v('job'));
            if (v('item')) parts.unshift(v('item'));
            var html = v('date') ? ICONS.clock + '<span>' + parts.filter(Boolean).map(escapeHtml).join(' · ') + '</span>' : '';
            sumEl.innerHTML = html;
            var s2 = root.querySelector('.tfw-bk-sum2'); if (s2 && !root.classList.contains('tfw-bk-sent')) s2.innerHTML = html;
        }

        /* ---------- проверка и отправка ---------- */
        function setBad(k, msg) {
            var box = form.querySelector('.tfw-bk-f[data-k="' + k + '"]');
            if (!box) return;
            box.classList.toggle('tfw-bk-bad', !!msg);
            box.querySelector(':scope > .tfw-bk-err').textContent = msg || '';
        }
        function validEmail(x) { return /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(x); }
        function collect() {
            var data = {}, bad = [];
            var val = function (n) { var el = fe(n); return el ? String(el.value || '').trim() : ''; };
            keys.forEach(function (k) {
                var err = '', names = k === 'start' ? ['date', 'time'] : k === 'end' ? ['endDate', 'endTime'] : [k];
                if (!F.time.on && (k === 'start' || k === 'end')) names = names.slice(0, 1);
                names.forEach(function (n) {
                    var v = val(n);
                    if (!v && (F[k].required || (cfg.preset === 'rental' && (k === 'start' || k === 'end')))) err = err || T.required;
                    if (v) data[n] = v;
                });
                var v0 = val(names[0]);
                if (k === 'email' && v0 && !validEmail(v0)) err = T.badEmail;
                if (k === 'phone' && v0 && !/^[+()\d\s.\/-]{5,30}$/.test(v0)) err = T.badPhone;
                if (k === 'end' && !err && data.endDate && data.date) {
                    var a = data.date + ' ' + (data.time || '00:00'), b = data.endDate + ' ' + (data.endTime || '23:59');
                    if (b <= a) err = T.endBefore;
                }
                setBad(k, err);
                if (err) bad.push(k);
            });
            if (!bad.length && !data.phone && !data.email) { bad.push(F.phone.on ? 'phone' : 'email'); setBad(bad[0], T.contactOne); }
            var consentOk = true;
            if (cfg.consent.on) {
                var c = fe('_consent');
                consentOk = !!(c && c.checked);
                c.closest('.tfw-bk-consent').classList.toggle('tfw-bk-bad', !consentOk);
            }
            return { data: data, bad: bad, consentOk: consentOk };
        }
        on(form, 'input', function (e) { var b = e.target.closest('.tfw-bk-f[data-k]'); if (b) setBad(b.dataset.k, ''); status.textContent = ''; });
        on(form, 'change', function (e) {
            var t = e.target;
            if (t.tagName === 'SELECT') t.classList.toggle('tfw-bk-empty', !t.value);
            if (t.name === 'service' && fe('date') && fe('date').value) {
                var d = parseYmd(fe('date').value);
                if (!dayAllowed('date', d)) setDate('date', ''); else fillTimes('time', fe('date').value);
            }
            var b = t.closest('.tfw-bk-consent'); if (b) b.classList.remove('tfw-bk-bad');
            summary();
        });

        var sending = false;
        on(form, 'submit', function (e) {
            e.preventDefault();
            if (sending) return;
            closeCals();
            var r = collect();
            if (r.bad.length) {
                var box = form.querySelector('.tfw-bk-f[data-k="' + r.bad[0] + '"]');
                var first = box && box.querySelector('input:not([type=hidden]),select,textarea,.tfw-bk-pick');
                if (first) first.focus();
                return;
            }
            if (!r.consentOk) { status.textContent = T.consentMiss; return; }
            if (preview) { done(); return; }                      // превью в конфигураторе: ничего не отправляем
            sending = true; btn.disabled = true; status.textContent = '';
            var payload = {
                fields: r.data,
                consent: cfg.consent.on ? true : undefined,
                _website: fe('_website') ? fe('_website').value : '',
                t: Date.now() - started,
                page: location.href.slice(0, 300),
                v: VERSION
            };
            fetch((opts.api || API) + '/f/' + encodeURIComponent(id), {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },   // простой запрос без preflight
                body: JSON.stringify(payload)
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok && j.ok, j: j, status: res.status }; });
            }).then(function (x) {
                if (x.ok) { done(); return; }
                status.textContent = x.status === 429 ? T.rate : x.j && x.j.error === 'fields' ? T.check : T.fail;
            }).catch(function () {
                status.textContent = T.network;
            }).then(function () { sending = false; btn.disabled = false; });
        });

        function done() {
            summary();
            root.classList.add('tfw-bk-sent');
            var d = root.querySelector('.tfw-bk-done'); if (d) { d.setAttribute('tabindex', '-1'); if (!preview) d.focus({ preventScroll: true }); }
            form.reset();
            form.querySelectorAll('input[type=hidden]').forEach(function (h) { setDate(h.name, ''); });
            form.querySelectorAll('select').forEach(function (s) { s.classList.add('tfw-bk-empty'); });
            if (preview) setTimeout(function () { root.classList.remove('tfw-bk-sent'); summary(); }, 3200);  // превью: форма возвращается
        }

        var widget = {
            root: root, config: cfg, id: id, launcher: launch,
            isOpen: function () { return !!(modal && modal.classList.contains('tfw-bk-open')); },
            open: function () {
                if (!modal) return;
                lastFocus = document.activeElement;
                modal.classList.add('tfw-bk-open');
                if (root.classList.contains('tfw-bk-sent') && !preview) { root.classList.remove('tfw-bk-sent'); started = Date.now(); summary(); }
                var f = root.querySelector('select, input:not([type=hidden]):not([tabindex="-1"]), .tfw-bk-pick, textarea');
                if (f && !preview) setTimeout(function () { f.focus(); }, 60);
            },
            close: function () {
                if (!modal) return;
                closeCals();
                modal.classList.remove('tfw-bk-open');
                if (lastFocus && lastFocus.focus && !preview) lastFocus.focus();
            },
            destroy: function () {
                cleanups.forEach(function (f) { try { f(); } catch (e) {} });
                if (launch) launch.remove();
                if (modal) modal.remove(); else root.remove();
                var s = document.getElementById(styleId); if (s) s.remove();
            }
        };
        if (modal && opts.open) { modal.style.transition = 'none'; widget.open(); setTimeout(function () { modal.style.transition = ''; }, 30); }
        return widget;
    }
})();
