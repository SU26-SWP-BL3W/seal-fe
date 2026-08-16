# components/domain/

Component nghiệp vụ dùng lại giữa nhiều `views/` trong cùng 1 feature hoặc xuyên feature
(vd `NavigationBar`, `NotificationBell`). Khác `components/ui/` — ui/ không biết gì về
nghiệp vụ (không import repositories/viewModels), domain/ thì có.
