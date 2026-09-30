import { TestBed } from '@angular/core/testing';

import { WearableService } from './wearable.service';

describe('WearableService', () => {
  let service: WearableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WearableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
