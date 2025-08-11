# CareSync - Système Intelligent de Gestion des Urgences

**Français** | [English](./README.md)

## Vidéo de Démonstration

https://github.com/user-attachments/assets/3f42b9ac-d325-4b4f-b3b1-d22c6143fdd9

Vous pouvez essayer l'app [ici](https://hackathon-shipfast-caresync.vercel.app/).

## Présentation

CareSync est un système avancé de gestion des soins de santé conçu pour optimiser les flux de travail des services d'urgence grâce à l'intelligence artificielle et à la surveillance des patients en temps réel. Cette plateforme complète intègre l'enregistrement vocal des patients, l'analyse de triage alimentée par l'IA et la gestion intelligente des flux de travail pour améliorer l'efficacité de la prestation des soins de santé et les résultats pour les patients.

## Contexte de Développement

Ce projet a été développé dans le cadre du hackathon **Shipfast w/ Anthropic, Cerebras, Lovable and Windsurf**, démontrant l'intégration de technologies d'IA de pointe dans les applications de santé.

## Membres de l'Équipe

- [**Paul Archer**](https://github.com/archer-paul)
- [**Tom Effernelli**](https://github.com/tom-effernelli)
- [**Orpheo Hellandsjo**](https://www.linkedin.com/in/orpheo-hellandsjo/)
- [**Valentin Potié**](https://www.linkedin.com/in/valentinpotie/)
- [**Basekou Diaby**](https://www.linkedin.com/in/basekou-diaby/)

## Fonctionnalités Principales

### 1. Système Intelligent d'Enregistrement Patient
- **Enregistrement Vocal**: Traitement du langage naturel alimenté par l'IA Claude d'Anthropic pour un enregistrement patient fluide
- **Saisie Multi-Modale**: Support pour la collecte de données traditionnelle par formulaire et vocale
- **Validation Temps Réel**: Validation intelligente des formulaires avec gestion contextuelle des erreurs et suggestions
- **Analyse d'Images Médicales**: Analyse alimentée par l'IA des photographies de blessures pour une évaluation préliminaire

### 2. Analyse de Triage Alimentée par l'IA
- **Support de Décision Clinique**: Algorithmes avancés pour la détermination du niveau d'urgence et l'allocation des ressources
- **Stratification des Risques**: Priorisation automatisée des patients basée sur les indicateurs cliniques et les données historiques
- **Analyse Prédictive**: Modèles d'apprentissage automatique pour l'estimation des temps d'attente et la prévision de la durée de traitement
- **Évaluation Multi-Facteurs**: Intégration des signes vitaux, symptômes, antécédents médicaux et preuves visuelles

### 3. Gestion Dynamique des Flux de Travail
- **Suivi Patient Temps Réel**: Tableau de bord en direct avec interface glisser-déposer pour l'optimisation des flux de travail
- **Tableau Style Kanban**: Représentation visuelle de la progression des patients à travers les étapes du service d'urgence
- **Mises à Jour Automatiques du Statut**: Transitions d'état patient pilotées par le système avec maintien de la piste d'audit
- **Optimisation des Ressources**: Allocation intelligente du personnel médical et de l'équipement basée sur la demande actuelle

### 4. Analyses Avancées et Rapports
- **Métriques de Performance**: Tableau de bord complet avec indicateurs clés de performance et analyse des tendances
- **Reconnaissance des Modèles Saisonniers**: Analyse des données historiques pour la planification des capacités et la gestion des ressources
- **Modélisation Prédictive**: Prévision statistique pour le volume de patients et les exigences en ressources
- **Assurance Qualité**: Surveillance continue des métriques de qualité des soins et de satisfaction des patients

## Architecture Technique

### Framework Frontend
- **React 18** avec TypeScript pour un développement type-safe
- **Tailwind CSS** pour une conception d'interface utilisateur responsive et accessible
- **Shadcn/UI** bibliothèque de composants pour une implémentation cohérente du système de design
- **React Hook Form** avec validation Zod pour une gestion robuste des formulaires

### Infrastructure Backend
- **Supabase** pour les opérations de base de données en temps réel et l'authentification
- **PostgreSQL** avec Row Level Security (RLS) pour la protection des données
- **Edge Functions** pour le traitement IA serverless et l'intégration d'API externes

### Intelligence Artificielle et Apprentissage Automatique
- **API Claude d'Anthropic** pour le traitement du langage naturel et le support de décision clinique
- **Web Speech API** pour la reconnaissance et la synthèse vocale
- **Vision par Ordinateur** pour l'analyse et l'évaluation d'images médicales

### Sécurité et Conformité
- **Contrôle d'Accès Basé sur les Rôles (RBAC)** avec hiérarchies du personnel médical
- **Journalisation d'Audit Complète** pour toutes les interactions système et modifications de données
- **Chiffrement des Données** pour la protection des informations médicales sensibles
- **Mesures de Sécurité Conformes HIPAA** et contrôles de confidentialité

## Installation et Configuration

### Prérequis
- Node.js 18.0 ou supérieur
- Gestionnaire de paquets npm ou yarn
- Compte Supabase et configuration de projet

### Configuration de l'Environnement
Créer un fichier `.env.local` avec les variables suivantes :
```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
ANTHROPIC_API_KEY=votre_cle_api_anthropic
```

### Étapes d'Installation
```bash
# Cloner le dépôt
git clone https://github.com/your-username/CareSync-AI-Triage.git
cd CareSync-AI-Triage

# Installer les dépendances
npm install

# Initialiser le schéma de base de données
npm run db:migrate

# Démarrer le serveur de développement
npm run dev
```

## Guide d'Utilisation

### Pour le Personnel Médical
1. **Authentification**: Se connecter avec les identifiants médicaux assignés
2. **Gestion des Patients**: Accéder au tableau de bord patient pour surveillance en temps réel
3. **Évaluation de Triage**: Effectuer des évaluations cliniques avec support de décision assisté par IA
4. **Optimisation des Flux**: Utiliser l'interface glisser-déposer pour la gestion du flux patient

### Pour les Patients
1. **Auto-Enregistrement**: Compléter l'enregistrement en utilisant la voix ou la saisie traditionnelle
2. **Antécédents Médicaux**: Fournir des informations de santé complètes et symptômes actuels
3. **Upload d'Images**: Soumettre des photographies de blessures pour analyse IA (optionnel)
4. **Reçu QR Code**: Recevoir une identification numérique pour suivi et mises à jour

### Pour les Administrateurs
1. **Tableau de Bord Analytics**: Surveiller les performances du service et l'utilisation des ressources
2. **Gestion du Personnel**: Configurer les rôles utilisateur et permissions
3. **Configuration Système**: Ajuster les paramètres IA et les réglages de flux de travail
4. **Révision d'Audit**: Accéder aux journaux complets pour conformité et assurance qualité

## Documentation API

### Points de Terminaison Principaux
- `POST /api/patients` - Créer un nouveau dossier patient
- `GET /api/patients` - Récupérer la liste des patients avec filtrage
- `PUT /api/patients/:id` - Mettre à jour le statut et les informations patient
- `POST /api/triage/analyze` - Effectuer une analyse de triage alimentée par IA
- `GET /api/analytics` - Générer des rapports de performance et statistiques

### Authentification
Tous les points de terminaison API nécessitent une authentification via des tokens JWT Supabase avec permissions appropriées basées sur les rôles.

## Métriques de Performance

Le système a été optimisé pour :
- **Temps de réponse sous la seconde** pour les opérations critiques
- **Disponibilité de 99,9%** grâce à une gestion d'erreur robuste et des mécanismes de fallback
- **Conformité WCAG 2.1 AA** pour les standards d'accessibilité
- **Design responsive mobile** pour la compatibilité multi-appareils

## Contribution

Nous accueillons les contributions de la communauté technologique de la santé. Veuillez consulter nos directives de contribution et code de conduite avant de soumettre des pull requests.

### Standards de Développement
- Mode strict TypeScript activé
- Configuration ESLint et Prettier pour la cohérence du code
- Tests unitaires et d'intégration complets
- Pratiques de développement sécurisé en priorité

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour les termes et conditions détaillés.

## Remerciements

Remerciements spéciaux aux organisateurs du hackathon Shipfast et aux partenaires technologiques de soutien : Anthropic, Cerebras, Lovable et Windsurf pour avoir fourni la plateforme et les ressources qui ont rendu ce projet possible.

## Informations de Contact

Pour les demandes techniques, opportunités de collaboration ou assistance de déploiement, veuillez contacter l'équipe de développement via le dépôt du projet ou les canaux de communication du hackathon.

---

**Avertissement**: Ce système est conçu à des fins éducatives et de démonstration. Tout déploiement en production dans des environnements de soins de santé doit faire l'objet d'une validation clinique appropriée, d'une approbation réglementaire et d'une vérification de conformité.
