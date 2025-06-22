import requests
from bs4 import BeautifulSoup

url = """https://news.naver.com/section/100"""
r = requests.get(url)

if r.status_code == 200:
   html = r.text
   soup = BeautifulSoup(html, 'html.parser')
   data1 = soup.select_one('#newsct >
                           div.section_component.as_section_headliine._P')
   data = soup.select_one('#newsct > 
div.section_component.as_section_headline._PERSIST_CONTENT > 
div.section_article.as_headline._TEMPLATE')
   print(data)
   


 print(' '.join(data.get_text().split('\n')))
else:
 print(r.status_code)