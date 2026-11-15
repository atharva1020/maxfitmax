import { Component, OnInit, OnDestroy, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

export interface VideoReel {
  id: string;
  creatorName: string;
  title: string;
  videoUrl: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  likes: number;
  comments: number;
  saved: boolean;
}

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit, OnDestroy {
  // Feed list stream
  private feedSubject = new BehaviorSubject<VideoReel[]>([]);
  public feed$ = this.feedSubject.asObservable();

  private subscriptions = new Subscription();
  private observer!: IntersectionObserver;
  private currentPage = 1;
  private isFetching = false;

  @ViewChildren('videoContainer') videoContainers!: QueryList<ElementRef>;

  // Initial Mock Dataset
  private mockReelsList: VideoReel[] = [
    {
      id: 'reel_001',
      creatorName: 'ChefDietician_Alex',
      title: 'Fluffy High Protein Pancake Tower 🥞',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-preparing-a-healthy-pancake-breakfast-41584-large.mp4',
      calories: 390,
      protein: 38,
      carbs: 45,
      fats: 6,
      likes: 12400,
      comments: 312,
      saved: false
    },
    {
      id: 'reel_002',
      creatorName: 'BulkGains_Greg',
      title: 'Garlic Butter Chicken Thigh & Crispy Potatoes 🍗',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-frying-diced-chicken-breast-meat-in-a-pan-42861-large.mp4',
      calories: 610,
      protein: 48,
      carbs: 52,
      fats: 22,
      likes: 42100,
      comments: 980,
      saved: true
    },
    {
      id: 'reel_003',
      creatorName: 'HealthyEats_Sam',
      title: 'Vegan Creamy Avocado Pesto Zoodles 🥑',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vegetables-being-chopped-on-a-wooden-board-41979-large.mp4',
      calories: 310,
      protein: 12,
      carbs: 28,
      fats: 18,
      likes: 8900,
      comments: 115,
      saved: false
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Load initial feed batch
    this.fetchNextBatch();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  // Setup observer tracking scroll indices
  setupIntersectionObserver(): void {
    const options = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.6 // triggers when 60% of element is active/visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
          const totalCount = this.feedSubject.value.length;

          // Trigger background fetch when scrolling past the 70% threshold (e.g. index 7 in 10 reels)
          if (index >= totalCount - 2 && !this.isFetching) {
            this.fetchNextBatch();
          }

          // Handle auto-playing and pausing video elements
          const videoElement = entry.target.querySelector('video');
          if (videoElement) {
            videoElement.play().catch(() => {});
          }
        } else {
          // Pause when scrolling away
          const videoElement = entry.target.querySelector('video');
          if (videoElement) {
            videoElement.pause();
          }
        }
      });
    }, options);

    // Watch query list changes to observe new elements dynamically
    this.subscriptions.add(
      this.videoContainers.changes.subscribe((comps: QueryList<ElementRef>) => {
        comps.forEach(comp => {
          this.observer.observe(comp.nativeElement);
        });
      })
    );
  }

  // Background fetch simulating paginated API calls
  fetchNextBatch(): void {
    this.isFetching = true;
    setTimeout(() => {
      // Append duplicates with new randomized ID suffix for demonstration
      const currentList = this.feedSubject.value;
      const nextBatch = this.mockReelsList.map(item => ({
        ...item,
        id: `${item.id}_p${this.currentPage}_${Math.floor(Math.random() * 1000)}`,
        likes: item.likes + Math.floor(Math.random() * 200)
      }));

      this.feedSubject.next([...currentList, ...nextBatch]);
      this.currentPage++;
      this.isFetching = false;
    }, 800); // 800ms loading simulator
  }

  toggleSave(reel: VideoReel): void {
    reel.saved = !reel.saved;
  }

  likeReel(reel: VideoReel): void {
    reel.likes++;
  }
}
