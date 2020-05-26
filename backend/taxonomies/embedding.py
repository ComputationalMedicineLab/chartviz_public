import re
from functools import lru_cache
from os.path import abspath, dirname, join

from gensim.models.word2vec import Word2Vec

from .models import ICD

prefix_re = re.compile(r'^(LAB: [+-]?\d|ICD:|MED:)')
fpath = join(dirname(abspath(__file__)),
             'resources',
             'icdmedlab_embedding.gen')
model = Word2Vec.load(fpath)


@lru_cache()
def most_similar(code):
    """ Accepts an ICD code (str) and returns the top 1000 similar items"""
    try:
        similar = model.wv.similar_by_word(f'ICD: {code}', topn=1000)
    except KeyError:
        # word is not in vocabulary - get the highest ranking result with
        # the same parent
        icd = ICD.objects.get(code=code)
        hasrank = ICD.objects.filter(rank__isnull=False).order_by('rank')
        candidates = (obj for obj in hasrank if obj.parent == icd.parent)
        new_icd = next(candidates)
        code = f'ICD: {new_icd.code}'
        try:
            similar = model.wv.similar_by_word(f'ICD: {code}', topn=1000)
        except KeyError:
            # Give up
            similar = []
    return similar


def disjoin_word(word):
    """Returns (prefix_type, code) for a given vocabulary item"""
    return word[0:3], prefix_re.sub('', word).strip()
