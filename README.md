ChartViz
========
Maintainer Email: john.m.still@vumc.org

A chart visualization / summarization prototype.

The app is composed of a Django Rest Framework API, a react frontend, and a
postgres db all running in docker containers. The prototype requires some data
files in order to run. The files located in `backend/initial_data/resources/`
provide some data files and headers for each data file needed. The files
`codes/chapters.csv`, `codes/icds.csv`, and `codes/phecodes.csv` contain a
taxonomy of ICD9 billing codes organized into chapters and related to more
clinically oriented phecodes; this taxonomy is used throughout the frontend to
organize and display patient information. All other files in
`backend/initial_data/resources` are stubs with CSV headers which will need to
be supplied by potential users with information appropriate to their
institution.

Additionally, a file `backend/taxonomies/resources/icdmedlab_embedding.gen`
will need to be supplied, which is a `gensim.models.word2vec.Word2Vec` model
relating ICD codes, labs, and medications. Vocabulary RE's are in
`backend/taxonomies/embedding.py`. This model is required, but until a model
can be trained on OMOP or other standardized data, it will need to be generated
per institution using an institution-appropriate vocabulary and dataset.

The management command to load codes from CSV into the database at
`backends/initial_data/management/commands/load_codes.py` requires a mapping
from lab codes to categories (we used this to, for example, group certain
results such as the Complete Blood Counts or blood chemistry panels).
Similarly, since some frontend views treat blood chemistry and cbc panel labs
uniquely, a listing will need to be given in `backends/patients/util.py` (where
lab results are grouped into Chemistry, CBC, and other before use by the API).

In `backend/patients/api.py` where clinical notes are fetched from the database
by the API we exclude certain types of perfunctory or overly common documents
by matching against VUMC specific doc types and sub types. This code is
included in a comment and can be adapted as needed.

Development of this code was funded in part by grant R01EB020666 from the
National Institute of Biomedical Imaging and Bioengineering.
