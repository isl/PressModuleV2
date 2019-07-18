Working Dev Deployment: http://139.91.183.97:28004/

# PRESS Forth Version
## Publication REpository Semantic System

Publication management systems can be instrumental in disseminating research results across academia and industry, by providing facilities for uploading, editing and searching for publications. Usually, these systems can be used by individuals to assist them in their research or by organizations to help them classify and promote their publication items.

**PRESS** is an open-source publication system that exploits semantic technologies in order to cover the needs of both individuals and organizations. Thus, it supports fast data entry, advanced query capabilities and integration with other systems or datasets.

### Module Installation

* Install [Drupal 7](https://www.drupal.org/docs/7/install)
* Install and enable the following modules
  * [jQuery Update](https://www.drupal.org/project/jquery_update)
    * Enable for jQuery 1.10
  * [Entity API](https://www.drupal.org/project/entity)
  * [Universally Unique IDentifier](https://www.drupal.org/project/uuid)
  * [Token](https://www.drupal.org/project/token)
  * [Pathauto](https://www.drupal.org/project/pathauto)
* Copy Drupal Module contents folder (sites/all/modules/publication_mod) in folder "sites/all/modules/"
* Enable PRESS Organization Field & PRESS Publication Module
* In case not all menus appear, please clear all caches from "[yourwebsite]/admin/config/development/performance"

### Module Configuration

#### Empty Database

* Go at "[yourwebsite]/admin/config/publications/publication_mod"
  * Add Blazegraph REST API URL
  * Add the Ontology Prefix
  * Create the Organizations that are going to be used for PRESS. Go to Configuration -> PRESS Publication Module -> Edit Organizations (or "[yourwebsite]/admin/config/publications/publication_mod/edit_orgs"). Then add the Organizations based on the Format provided,  "[Label] | [Blazegraph_value] | [array of possible values (for LDAP)]".
* When you enable for the first time the PRESS Publication Module, it adds three fields for the user account and one user role called "Power User"
  * You have to enable role "Publication Mod Power User" for the selected user to add a Publication without being a contributor. The module assigns automatically the admin as Power User
  * You will also have to fill the above fields for your account in order to use the module.

#### Importing a Database

If you already have a database loaded in Blazegraph, you can import the Publications and create the static pages for each publication, as well as import the Organizations from the database.

* Go at "[yourwebsite]/admin/config/publications/publication_mod"
  * Add Blazegraph REST API URL
  * Add the Ontology Prefix
  * Import the Organizations. Go to Configuration -> PRESS Publication Module -> Edit Organizations (or "[yourwebsite]/admin/config/publications/publication_mod/edit_orgs"). Then click on "Import Organizations from Blazegraph" and then "Submit Changes"
  * Import the Publications. Go to Configuration -> PRESS Publication Module -> Import Publications (or "[yourwebsite]/admin/config/publications/publication_mod/import_pubs"). Then click on "Import from Blazegraph".
* When you enable for the first time the PRESS Publication Module, it adds three fields for the user account and one user role called "Power User"
  * You have to enable role "Publication Mod Power User" for the selected user to add a Publication without being a contributor. The module assigns automatically the admin as Power User
  * You will also have to fill the above fields for your account in order to use the module.

### Module Uninstallation

To uninstall the module, you follow the standard procedure for a Drupal Module uninstallation, by first uninstalling the PRESS Publication Module and then the PRESS Organization Field module.

* Disable the PRESS Publication Module from the administration module panel ([yourwebsite]/admin/modules) by unticking the module.
* In the same page, in the uninstall tab on the top right corner, you can uninstall the PRESS Publication Module.

After uninstalling the module, you can disable and uninstall the PRESS Organization Field module.
In case you are unable to disable the PRESS Organization Field module, you have to run Cron a couple of times to delete the fields that are using the organization field type. You can run Cron in the admin configuration page, under Cron (or [yourwebsite]/admin/config/system/cron) and press Run Cron. It might need to be run a couple of times.
Now you can disable and uninstall the PRESS Organization Field following the above procedure.
