// 絵本の読み聞かせ進行（ページ送り）を管理する小さなクラス。
// 通常読み聞かせ・録音読み聞かせのどちらからも共通で利用する。

export class BookReader {
  constructor(book) {
    this.book = book;
    this.pageIndex = 0;
  }

  get totalPages() {
    return this.book.pages.length;
  }

  currentText() {
    const page = this.book.pages[this.pageIndex];
    return typeof page === "string" ? page : page.text;
  }

  // 将来イラストを差し替える際の参考情報(現状は画面には表示しない)
  currentImageHint() {
    const page = this.book.pages[this.pageIndex];
    return typeof page === "string" ? "" : page.imageHint || "";
  }

  isFirstPage() {
    return this.pageIndex === 0;
  }

  isLastPage() {
    return this.pageIndex === this.totalPages - 1;
  }

  next() {
    if (!this.isLastPage()) this.pageIndex++;
    return this.isLastPage();
  }

  prev() {
    if (!this.isFirstPage()) this.pageIndex--;
  }
}
